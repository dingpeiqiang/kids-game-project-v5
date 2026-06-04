package com.kidgame.common.util;

import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.nio.file.Files;

/**
 * 音频格式转换工具类
 * 使用 FFmpeg 将各种音频格式转换为 MP3
 */
@Slf4j
public class AudioConvertUtil {

    /**
     * 检查是否需要转换
     * @param filename 文件名
     * @return 是否需要转换
     */
    public static boolean needsConversion(String filename) {
        if (filename == null || !filename.contains(".")) {
            return false;
        }
        String ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
        return !".mp3".equals(ext);
    }

    /**
     * 获取文件扩展名
     */
    public static String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    /**
     * 转换音频为 MP3 格式
     * 使用 FFmpeg 进行转换
     *
     * @param inputStream 输入流
     * @param filename 原文件名
     * @return MP3 格式的输入流
     */
    public static InputStream convertToMp3(InputStream inputStream, String filename) throws Exception {
        String extension = getExtension(filename);

        // 如果已经是 MP3，直接返回
        if (".mp3".equals(extension)) {
            return inputStream;
        }

        log.info("开始转换音频格式: {} -> MP3", extension);

        // 创建临时文件
        File tempInput = null;
        File tempOutput = null;

        try {
            // 保存输入流到临时文件
            tempInput = File.createTempFile("audio_input_", extension);
            tempOutput = File.createTempFile("audio_output_", ".mp3");

            // 写入输入文件
            byte[] inputData = inputStream.readAllBytes();
            Files.write(tempInput.toPath(), inputData);

            log.info("临时文件创建完成, 输入: {}, 输出: {}", tempInput.getAbsolutePath(), tempOutput.getAbsolutePath());

            // 调用 FFmpeg 转换
            boolean success = convertWithFFmpeg(tempInput, tempOutput);

            if (success && tempOutput.exists() && tempOutput.length() > 0) {
                byte[] mp3Data = Files.readAllBytes(tempOutput.toPath());
                log.info("音频转换为 MP3 成功, 大小: {} bytes", mp3Data.length);
                return new ByteArrayInputStream(mp3Data);
            } else {
                throw new Exception("FFmpeg 转换失败");
            }

        } catch (Exception e) {
            log.error("音频转换失败: {}", e.getMessage(), e);
            throw new Exception("音频转换失败: " + e.getMessage(), e);
        } finally {
            // 清理临时文件
            if (tempInput != null) tempInput.delete();
            if (tempOutput != null) tempOutput.delete();
        }
    }

    /**
     * 使用 FFmpeg 进行音频转换
     */
    private static boolean convertWithFFmpeg(File input, File output) {
        try {
            // 构建 FFmpeg 命令
            // -y: 覆盖输出文件 -vn: 不处理视频 -acodec: 音频编码器 libmp3lame -aq: 音频质量
            ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg",
                "-y",
                "-i", input.getAbsolutePath(),
                "-vn",
                "-acodec", "libmp3lame",
                "-aq", "2",
                "-loglevel", "error",
                output.getAbsolutePath()
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 读取输出
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder outputBuilder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                outputBuilder.append(line).append("\n");
            }

            int exitCode = process.waitFor();

            if (exitCode == 0) {
                log.info("FFmpeg 转换成功");
                return true;
            } else {
                log.error("FFmpeg 转换失败, 退出码: {}, 输出: {}", exitCode, outputBuilder);
                return false;
            }

        } catch (Exception e) {
            log.error("调用 FFmpeg 失败: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 转换音频 - 失败时返回原始流
     */
    public static InputStream convertToAudioSafe(InputStream inputStream, String filename) {
        try {
            return convertToMp3(inputStream, filename);
        } catch (Exception e) {
            log.warn("音频转换失败，返回原始流: {}", e.getMessage());
            try {
                // 返回原始流的副本
                byte[] data = inputStream.readAllBytes();
                return new ByteArrayInputStream(data);
            } catch (Exception ex) {
                log.error("读取原始流失败: {}", ex.getMessage());
                return inputStream;
            }
        }
    }
}
