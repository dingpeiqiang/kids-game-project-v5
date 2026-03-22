package com.kidgame.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * 音频格式转换服务
 * 将 WebM/WAV 等格式转换为 MP3
 */
@Slf4j
@Service
public class AudioConverterService {

    @Value("${upload.path:./uploads}")
    private String uploadPath;

    /**
     * 将音频文件转换为 MP3
     * 
     * @param file 输入的音频文件（WebM/WAV 等）
     * @return 转换后的 MP3 文件路径（相对路径）
     * @throws IOException 转换失败时抛出异常
     */
    public String convertToMp3(MultipartFile file) throws IOException {
        log.info("🎵 开始转换音频文件：{}, 大小：{} bytes", 
                 file.getOriginalFilename(), file.getSize());

        // 1. 保存原始文件到临时目录
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String tempFileName = UUID.randomUUID().toString() + "." + fileExtension;
        
        Path tempFilePath = Paths.get(uploadPath, "temp", tempFileName);
        Files.createDirectories(tempFilePath.getParent());
        file.transferTo(tempFilePath.toFile());

        log.debug("原始文件已保存：{}", tempFilePath);

        // 2. 转换为 MP3
        String mp3FileName = UUID.randomUUID().toString() + ".mp3";
        Path mp3FilePath = Paths.get(uploadPath, "audio", mp3FileName);
        Files.createDirectories(mp3FilePath.getParent());

        try {
            convertUsingFFmpeg(tempFilePath.toString(), mp3FilePath.toString());
            log.info("✅ 音频转换成功：{} -> {}", tempFilePath, mp3FilePath);
        } catch (Exception e) {
            log.error("❌ 音频转换失败", e);
            // 清理输出文件（如果已创建）
            Files.deleteIfExists(mp3FilePath);
            throw new RuntimeException("音频转换失败：" + e.getMessage(), e);
        } finally {
            // 3. 清理临时文件
            try {
                Files.deleteIfExists(tempFilePath);
                log.debug("已清理临时文件：{}", tempFilePath);
            } catch (IOException e) {
                log.warn("清理临时文件失败：{}", tempFilePath, e);
            }
        }

        // 4. 返回相对路径（用于数据库存储）
        return "/audio/" + mp3FileName;
    }

    /**
     * 使用 FFmpeg 进行格式转换
     * 
     * @param inputPath 输入文件路径
     * @param outputPath 输出文件路径
     * @throws Exception 转换异常
     */
    private void convertUsingFFmpeg(String inputPath, String outputPath) throws Exception {
        log.info("🔄 调用 FFmpeg 转换：{} -> {}", inputPath, outputPath);

        // 构建 FFmpeg 命令
        ProcessBuilder processBuilder = new ProcessBuilder(
            "ffmpeg",
            "-i", inputPath,                    // 输入文件
            "-codec:a", "libmp3lame",          // 音频编码器：MP3
            "-b:a", "128k",                     // 比特率：128kbps
            "-ar", "44100",                     // 采样率：44.1kHz
            "-ac", "2",                         // 声道：立体声
            "-y",                               // 覆盖输出文件
            outputPath                          // 输出文件
        );

        // 合并错误输出到标准输出
        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        // 读取 FFmpeg 输出日志
        byte[] outputBytes = process.getInputStream().readAllBytes();
        String output = new String(outputBytes);
        log.debug("FFmpeg 输出:\n{}", output);

        // 等待进程完成（最多等待 60 秒）
        boolean finished = process.waitFor(60, java.util.concurrent.TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("FFmpeg 进程执行超时");
        }

        // 检查进程退出码
        int exitCode = process.exitValue();
        if (exitCode != 0) {
            throw new RuntimeException("FFmpeg 执行失败，退出码：" + exitCode);
        }

        // 验证输出文件
        File outputFile = new File(outputPath);
        if (!outputFile.exists()) {
            throw new RuntimeException("转换后的文件不存在");
        }
        
        if (outputFile.length() == 0) {
            throw new RuntimeException("转换后的文件为空");
        }

        log.info("✅ FFmpeg 转换完成，输出文件大小：{} bytes", outputFile.length());
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "webm";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }
}
