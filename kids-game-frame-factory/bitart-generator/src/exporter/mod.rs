use crate::generator::Canvas;
use image::{codecs::gif::GifEncoder, Frame, RgbaImage};
use std::fs::File;

const WHITE_THRESHOLD: u8 = 240;

/// Watermark removal settings for AI-generated images.
/// Removes common watermarks like "AI生成" from bottom-right corner.
const WATERMARK_MARGIN_X_PERCENT: f32 = 0.02;  // 2% margin from right edge
const WATERMARK_MARGIN_Y_PERCENT: f32 = 0.02;  // 2% margin from bottom edge
const WATERMARK_AREA_WIDTH_PERCENT: f32 = 0.15; // 15% width of image
const WATERMARK_AREA_HEIGHT_PERCENT: f32 = 0.08; // 8% height of image

/// Check if a pixel is likely a solid background color (white, gray, or near-uniform).
fn is_background_color(r: u8, g: u8, b: u8) -> bool {
    // Original white detection
    if r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD {
        return true;
    }
    
    // Detect uniform gray backgrounds (common in AI-generated images)
    // If all channels are within 30 of each other and brightness is medium-high
    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let is_uniform = (max - min) < 30;
    let brightness = (r as u16 + g as u16 + b as u16) / 3;
    
    // Gray backgrounds typically have brightness between 100-220
    is_uniform && brightness > 100 && brightness < 220
}

/// Check if coordinates fall within the watermark removal zone.
fn is_in_watermark_zone(x: u32, y: u32, width: u32, height: u32) -> bool {
    if width == 0 || height == 0 {
        return false;
    }
    
    let x_start = (width as f32 * (1.0 - WATERMARK_AREA_WIDTH_PERCENT - WATERMARK_MARGIN_X_PERCENT)) as u32;
    let y_start = (height as f32 * (1.0 - WATERMARK_AREA_HEIGHT_PERCENT - WATERMARK_MARGIN_Y_PERCENT)) as u32;
    let x_end = (width as f32 * (1.0 - WATERMARK_MARGIN_X_PERCENT)) as u32;
    let y_end = (height as f32 * (1.0 - WATERMARK_MARGIN_Y_PERCENT)) as u32;
    
    x >= x_start && x < x_end && y >= y_start && y < y_end
}

/// Check if a pixel is likely watermark text (dark text on light/gray background).
fn is_watermark_text(r: u8, g: u8, b: u8) -> bool {
    let brightness = (r as u16 + g as u16 + b as u16) / 3;
    // Watermark text is typically dark (brightness < 100)
    brightness < 100
}

fn canvas_to_rgba(canvas: &Canvas, scale: u32) -> RgbaImage {
    let h = canvas.len() as u32;
    let w = if h > 0 { canvas[0].len() as u32 } else { 0 };
    let mut img = RgbaImage::new(w * scale, h * scale);

    for (y, row) in canvas.iter().enumerate() {
        for (x, color) in row.iter().enumerate() {
            let [r, g, b] = *color;
            let in_watermark_zone = is_in_watermark_zone(x as u32, y as u32, w, h);
            
            let is_bg = is_background_color(r, g, b);
            let is_wm = in_watermark_zone && is_watermark_text(r, g, b);
            
            let rgba = if is_bg || is_wm {
                image::Rgba([r, g, b, 0])
            } else {
                image::Rgba([r, g, b, 255])
            };
            for dy in 0..scale {
                for dx in 0..scale {
                    let px = x as u32 * scale + dx;
                    let py = y as u32 * scale + dy;
                    img.put_pixel(px, py, rgba);
                }
            }
        }
    }

    img
}

/// Save the canvas as PNG at native resolution (1024x1024).
/// Near-white pixels are exported as transparent.
pub fn save_png(canvas: &Canvas, path: &str) -> Result<(), String> {
    let img = canvas_to_rgba(canvas, 1);
    img.save(path).map_err(|e| format!("Failed to save PNG: {}", e))
}

/// Save multiple named canvases as individual PNGs in a subfolder.
pub fn save_chain_pngs(
    tiles: &[(String, &Canvas)],
    base_dir: &str,
) -> Result<Vec<String>, String> {
    std::fs::create_dir_all(base_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    let mut paths = Vec::new();
    for (name, canvas) in tiles {
        // Sanitize name for filename
        let safe_name: String = name
            .chars()
            .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '_' })
            .collect();
        let filename = format!("{}.png", safe_name);
        let path = std::path::Path::new(base_dir)
            .join(&filename)
            .to_string_lossy()
            .to_string();

        let img = canvas_to_rgba(canvas, 1);
        img.save(&path)
            .map_err(|e| format!("Failed to save {}: {}", filename, e))?;
        paths.push(path);
    }

    Ok(paths)
}

/// Save multiple canvases as an animated GIF at 3fps (333ms per frame).
pub fn save_gif(frames: &[Canvas], path: &str) -> Result<(), String> {
    let file = File::create(path).map_err(|e| format!("Failed to create file: {}", e))?;
    let mut encoder = GifEncoder::new_with_speed(file, 10);
    encoder
        .set_repeat(image::codecs::gif::Repeat::Infinite)
        .map_err(|e| format!("Failed to set repeat: {}", e))?;

    for canvas in frames {
        let rgba = canvas_to_rgba(canvas, 1);
        let frame = Frame::from_parts(
            rgba,
            0,
            0,
            image::Delay::from_numer_denom_ms(333, 1),
        );
        encoder
            .encode_frame(frame)
            .map_err(|e| format!("Failed to encode frame: {}", e))?;
    }

    Ok(())
}
