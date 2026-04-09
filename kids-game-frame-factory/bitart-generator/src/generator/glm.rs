use std::io::{Cursor, Read};

use super::{Canvas, GenerationResult};

/// Download and decode an image from a URL.
fn download_image(url: &str) -> Result<image::DynamicImage, String> {
    let img_response = ureq::get(url)
        .call()
        .map_err(|e| format!("Failed to download image: {}", e))?;

    let mut bytes: Vec<u8> = Vec::new();
    img_response
        .into_reader()
        .read_to_end(&mut bytes)
        .map_err(|e| format!("Failed to read image data: {}", e))?;

    image::load_from_memory(&bytes)
        .map_err(|e| format!("Failed to decode image: {}", e))
}

/// Decode a base64-encoded image.
fn decode_base64_image(b64: &str) -> Result<image::DynamicImage, String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(b64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    image::load_from_memory(&bytes)
        .map_err(|e| format!("Failed to decode image: {}", e))
}

/// Convert an image to a Canvas at its native resolution (no resize).
fn image_to_canvas(img: &image::DynamicImage) -> Canvas {
    let rgb = img.to_rgb8();
    let w = rgb.width();
    let h = rgb.height();

    let mut canvas: Canvas = Vec::with_capacity(h as usize);
    for y in 0..h {
        let mut row = Vec::with_capacity(w as usize);
        for x in 0..w {
            let pixel = rgb.get_pixel(x, y);
            row.push([pixel[0], pixel[1], pixel[2]]);
        }
        canvas.push(row);
    }
    canvas
}

/// Check if model is GLM Image series.
fn is_glm_image(model: &str) -> bool {
    model.starts_with("glm-image")
}

/// Call GLM image generation API.
fn call_api(prompt: &str, api_key: &str, model: &str, size: &str) -> Result<image::DynamicImage, String> {
    // Use serde_json to create proper JSON
    let json_value = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "size": size,
    });
    
    // Serialize to UTF-8 bytes directly
    let json_bytes = serde_json::to_vec(&json_value)
        .map_err(|e| format!("Failed to serialize JSON: {}", e))?;
    
    // Send with longer timeout for image generation
    let agent = ureq::AgentBuilder::new()
        .timeout_read(std::time::Duration::from_secs(120))
        .timeout_write(std::time::Duration::from_secs(120))
        .build();
    
    let result = agent.post("https://open.bigmodel.cn/api/paas/v4/images/generations")
        .set("Authorization", &format!("Bearer {}", api_key))
        .set("Content-Type", "application/json")
        .send_bytes(&json_bytes);
    
    let response = match result {
        Ok(resp) => resp,
        Err(ureq::Error::Status(status_code, response)) => {
            // Try to read the response body
            let body_text = match response.into_string() {
                Ok(text) => text,
                Err(_) => "Unable to read response body".to_string(),
            };
            
            eprintln!("[ERROR] Response body: {}", body_text);
            
            // Check for content filter error - more comprehensive pattern matching
            let is_content_filter = body_text.contains("1301") 
                || body_text.contains("敏感内容") 
                || body_text.contains("不安全") 
                || body_text.contains("contentFilter")
                || body_text.contains("content filter")
                || body_text.contains("安全")
                || body_text.contains("不适合")
                || body_text.contains("policy");
            
            if is_content_filter {
                return Err("内容被安全过滤器拦截：提示词可能包含敏感或不安全内容。请尝试使用其他描述方式，例如用“超级英雄”、“特摄角色”等替代具体角色名称。".to_string());
            }
            
            return Err(format!("API request failed with status {}: {}", status_code, body_text));
        }
        Err(e) => {
            return Err(format!("API request failed: {}", e));
        }
    };

    let status_code = response.status();

    let body: serde_json::Value = response
        .into_json()
        .map_err(|e| format!("Failed to parse API response: {}", e))?;

    // Check for error
    if let Some(err) = body.get("error") {
        let err_str = format!("{:?}", err);
        
        // Check for content filter in JSON response - more comprehensive pattern matching
        let is_content_filter = err_str.contains("1301") 
            || err_str.contains("敏感") 
            || err_str.contains("不安全")
            || err_str.contains("contentFilter")
            || err_str.contains("content filter")
            || err_str.contains("安全")
            || err_str.contains("不适合")
            || err_str.contains("policy");
        
        if is_content_filter {
            return Err("内容被安全过滤器拦截：提示词可能包含敏感或不安全内容。请尝试使用其他描述方式，例如用“超级英雄”、“特摄角色”等替代具体角色名称。".to_string());
        }
        
        return Err(format!("API error: {}", err_str));
    }

    // GLM Image can return either base64 or URL
    if let Some(b64) = body["data"][0]["b64_json"].as_str() {
        decode_base64_image(b64)
    } else if let Some(url) = body["data"][0]["url"].as_str() {
        download_image(url)
    } else {
        Err("No image data (base64 or URL) found in response".to_string())
    }
}

/// Encode a DynamicImage to PNG bytes.
fn image_to_png_bytes(img: &image::DynamicImage) -> Result<Vec<u8>, String> {
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    Ok(buf.into_inner())
}

/// Get the appropriate image size for single image generation.
fn single_size(_model: &str) -> &'static str {
    "1280x1280"
}

/// Generate a single pixel art image.
pub fn generate(prompt: &str, api_key: &str, model: &str) -> Result<GenerationResult, String> {
    let full_prompt = format!(
        "Pixel art, 8-bit retro style, clear shapes with black outlines, vibrant colors, game sprite style: {}",
        prompt
    );

    // Ensure prompt doesn't exceed GLM's 1000 character limit
    let truncated_prompt = if full_prompt.len() > 900 {
        eprintln!("[WARN] Prompt too long ({} chars), truncating to 900", full_prompt.len());
        full_prompt.chars().take(900).collect()
    } else {
        full_prompt
    };

    let img = call_api(&truncated_prompt, api_key, model, single_size(model))?;
    let canvas = image_to_canvas(&img);

    Ok(GenerationResult {
        canvas,
        model: model.to_string(),
    })
}

/// A single tile produced by chained generation.
pub struct ChainTile {
    pub name: String,
    pub canvas: Canvas,
}

/// Generate a set of chained tile assets from a single prompt.
/// For GLM models, we generate each tile independently since edits API is not available.
pub fn generate_chain(prompt: &str, api_key: &str, model: &str) -> Result<Vec<ChainTile>, String> {
    // Simple tile decomposition for GLM (static list)
    let tile_names = vec![
        "base".to_string(),
        "variant 1".to_string(),
        "variant 2".to_string(),
    ];

    let mut tiles = Vec::new();

    for tile_name in &tile_names {
        let tile_prompt = format!(
            "Pixel art, 8-bit retro style, clear shapes with black outlines, vibrant colors, \
             game asset tile, plain white background, centered: {} - {}",
            prompt, tile_name
        );
        
        // Ensure prompt doesn't exceed GLM's 1000 character limit
        let truncated_prompt = if tile_prompt.len() > 900 {
            eprintln!("[WARN] Tile prompt too long ({} chars), truncating to 900", tile_prompt.len());
            tile_prompt.chars().take(900).collect()
        } else {
            tile_prompt
        };
        
        let img = call_api(&truncated_prompt, api_key, model, single_size(model))?;
        let canvas = image_to_canvas(&img);
        tiles.push(ChainTile {
            name: tile_name.clone(),
            canvas,
        });
    }

    Ok(tiles)
}

/// Generate 3 animation frames.
/// For GLM models, we generate each frame independently.
pub fn generate_spritesheet(prompt: &str, api_key: &str, model: &str) -> Result<Vec<Canvas>, String> {
    let base_prompt = format!(
        "Pixel art, 8-bit retro style, clear shapes with black outlines, vibrant colors, \
         game sprite style, plain white background, centered character: {}",
        prompt
    );

    // Ensure prompt doesn't exceed GLM's 1000 character limit
    let truncated_prompt = if base_prompt.len() > 900 {
        eprintln!("[WARN] Sprite prompt too long ({} chars), truncating to 900", base_prompt.len());
        base_prompt.chars().take(900).collect()
    } else {
        base_prompt
    };

    let img1 = call_api(&truncated_prompt, api_key, model, single_size(model))?;
    let canvas1 = image_to_canvas(&img1);

    let img2 = call_api(&truncated_prompt, api_key, model, single_size(model))?;
    let canvas2 = image_to_canvas(&img2);

    let img3 = call_api(&truncated_prompt, api_key, model, single_size(model))?;
    let canvas3 = image_to_canvas(&img3);

    Ok(vec![canvas1, canvas2, canvas3])
}
