package com.kidgame.service.impl;

import com.jcraft.jsch.*;
import com.kidgame.common.config.SftpConfig;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.util.AudioConvertUtil;
import com.kidgame.service.ResourceUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

/**
 * SFTP 资源上传服务实现
 *
 * 使用 JSch 库连接 SFTP 服务器进行文件上传和删除
 *
 * @author kids-game-team
 * @date 2026-03-19
 */
@Slf4j
@Service
@Primary  // 默认使用 SFTP 实现
@ConditionalOnProperty(name = "sftp.enabled", havingValue = "true", matchIfMissing = true)
public class ResourceUploadSftpServiceImpl implements ResourceUploadService {

    @Autowired
    private SftpConfig sftpConfig;

    // 允许的图片类型（MIME 类型）
    private static final List<String> IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    // 允许的音频扩展名（基于扩展名验证，更可靠）
    private static final List<String> AUDIO_EXTENSIONS = Arrays.asList(
        ".mp3", ".wav", ".ogg", ".webm", ".m4a", ".aac", ".flac", ".wma"
    );

    // 允许的音频 MIME 类型
    private static final List<String> AUDIO_MIME_TYPES = Arrays.asList(
        "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/x-wav",
        "audio/webm", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/flac"
    );

    // 最大文件大小 (MB)
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * 获取 SFTP 会话
     */
    private Session getSession() throws JSchException {
        JSch jsch = new JSch();

        log.info("正在连接 SFTP: host={}, port={}, username={}",
                sftpConfig.getHost(), sftpConfig.getPort(), sftpConfig.getUsername());

        // 如果使用密钥认证，加载私钥
        if (sftpConfig.isKeyAuth()) {
            try {
                // 尝试加载私钥文件
                Path keyPath = Paths.get(sftpConfig.getPrivateKeyPath());
                if (Files.exists(keyPath)) {
                    byte[] privateKey = Files.readAllBytes(keyPath);
                    jsch.addIdentity(sftpConfig.getUsername(), privateKey,
                            null, sftpConfig.getPassphrase() != null ?
                                    sftpConfig.getPassphrase().getBytes() : null);
                    log.info("SFTP 私钥加载成功：{}", sftpConfig.getPrivateKeyPath());
                } else {
                    throw new BusinessException("SFTP 私钥文件不存在：" + sftpConfig.getPrivateKeyPath());
                }
            } catch (IOException e) {
                throw new BusinessException("读取 SFTP 私钥文件失败：" + e.getMessage());
            }
        }

        Session session = jsch.getSession(sftpConfig.getUsername(), sftpConfig.getHost(), sftpConfig.getPort());

        // 设置连接参数
        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no"); // 不检查主机密钥
        config.put("PreferredAuthentications", sftpConfig.isKeyAuth() ?
                "publickey" : "password");
        session.setConfig(config);

        // 设置超时 - 使用更大的超时值
        session.setTimeout(sftpConfig.getConnectionTimeout() > 0 ? sftpConfig.getConnectionTimeout() : 30000);

        // 如果使用密码认证，设置密码
        if (sftpConfig.isPasswordAuth()) {
            session.setPassword(sftpConfig.getPassword());
        }

        return session;
    }

    /**
     * 执行 SFTP 操作
     */
    private <T> T executeSftp(SftpOperation<T> operation) {
        Session session = null;
        ChannelSftp channel = null;

        try {
            long startTime = System.currentTimeMillis();

            session = getSession();
            log.debug("开始连接 SFTP session...");
            session.connect(sftpConfig.getConnectionTimeout() > 0 ? sftpConfig.getConnectionTimeout() : 30000);
            log.debug("SFTP session 已连接, isConnected={}", session.isConnected());

            log.debug("打开 SFTP channel...");
            channel = (ChannelSftp) session.openChannel("sftp");
            
            // 设置 channel 超时时间
            int channelTimeout = sftpConfig.getReadTimeout() > 0 ? sftpConfig.getReadTimeout() : 30000;
            
            log.debug("开始连接 SFTP channel，超时：{}ms", channelTimeout);
            channel.connect(channelTimeout);
            log.debug("SFTP channel 已连接, isConnected={}, isClosed={}", channel.isConnected(), channel.isClosed());

            T result = operation.execute(channel);

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("SFTP 操作完成，耗时：{}ms", elapsed);

            return result;

        } catch (JSchException e) {
            String errorMsg = "SFTP 连接失败：" + e.getMessage();
            log.error(errorMsg + " - host={}, port={}, username={}, timeout={}",
                    sftpConfig.getHost(), sftpConfig.getPort(),
                    sftpConfig.getUsername(), sftpConfig.getConnectionTimeout(), e);
            throw new BusinessException(errorMsg);
        } catch (SftpException e) {
            log.error("SFTP 操作失败：{}", e.getMessage(), e);
            throw new BusinessException("SFTP 操作失败：" + e.getMessage());
        } catch (Exception e) {
            log.error("SFTP 未知错误：{}", e.getMessage(), e);
            throw new BusinessException("SFTP 错误：" + e.getMessage());
        } finally {
            try {
                if (channel != null && channel.isConnected()) {
                    channel.disconnect();
                }
            } catch (Exception e) {
                log.warn("关闭 SFTP channel 失败", e);
            }
            try {
                if (session != null && session.isConnected()) {
                    session.disconnect();
                }
            } catch (Exception e) {
                log.warn("关闭 SFTP session 失败", e);
            }
        }
    }

    /**
     * SFTP 操作接口
     */
    @FunctionalInterface
    private interface SftpOperation<T> {
        T execute(ChannelSftp channel) throws JSchException, SftpException;
    }

    @Override
    public String uploadImage(MultipartFile file, String category) {
        try {
            // 1. 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !IMAGE_TYPES.contains(contentType)) {
                throw new BusinessException("不支持的图片类型，仅支持：JPEG, PNG, GIF, WebP, SVG");
            }

            // 2. 验证文件大小
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new BusinessException("图片大小不能超过 5MB");
            }

            // 3. 上传文件
            return uploadFile(file, category);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("图片上传失败", e);
            throw new BusinessException("图片上传失败：" + e.getMessage());
        }
    }

    @Override
    public String uploadAudio(MultipartFile file, String category) {
        try {
            String originalFilename = file.getOriginalFilename();

            // 1. 验证文件大小
            if (file.getSize() > MAX_AUDIO_SIZE) {
                throw new BusinessException("音频大小不能超过 10MB");
            }

            // 2. 自动转换音频为 MP3 格式
            log.info("检测到音频文件: {}, 正在转换为 MP3 格式...", originalFilename);
            InputStream convertedStream = AudioConvertUtil.convertToMp3(file.getInputStream(), originalFilename);

            // 3. 创建转换后的 MultipartFile
            // 将转换后的流包装为临时文件，再创建 MultipartFile
            byte[] mp3Data = convertedStream.readAllBytes();
            log.info("音频转换完成, 原始大小: {} bytes, 转换后大小: {} bytes",
                file.getSize(), mp3Data.length);

            // 验证转换后的文件
            if (mp3Data.length == 0) {
                throw new BusinessException("音频转换失败，文件为空");
            }

            // 创建临时文件用于上传
            File tempFile = File.createTempFile("audio_", ".mp3");
            Files.write(tempFile.toPath(), mp3Data);

            try {
                // 4. 上传转换后的文件
                return uploadFile(tempFile, "audio.mp3", category);
            } finally {
                tempFile.delete();
            }

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("音频上传失败", e);
            throw new BusinessException("音频上传失败：" + e.getMessage());
        }
    }

    /**
     * 上传文件到 SFTP 服务器
     */
    private String uploadFile(MultipartFile file, String category) throws Exception {
        // 生成文件名
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".bin";
        String filename = UUID.randomUUID().toString().replace("-", "") + extension;

        // 生成日期路径
        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        String datePath = now.format(formatter);

        // 远程目录路径
        String remoteDir = sftpConfig.getBaseDirectory() + "/" + category + "/" + datePath;
        String remoteFileName = filename;

        // 上传到 SFTP
        String finalRemoteDir = remoteDir;
        String finalRemoteFileName = remoteFileName;

        executeSftp(channel -> {
            try {
                // 创建远程目录
                createRemoteDirectory(channel, finalRemoteDir);

                // 上传文件
                try (InputStream inputStream = file.getInputStream()) {
                    channel.put(inputStream, finalRemoteFileName);
                }

                log.info("文件上传成功：remoteDir={}, filename={}, size={}",
                        finalRemoteDir, finalRemoteFileName, file.getSize());

                return null;
            } catch (Exception e) {
                throw new SftpException(ChannelSftp.SSH_FX_FAILURE, e.getMessage());
            }
        });

        // 构建返回的 URL
        String relativePath = category + "/" + datePath + "/" + filename;
        return buildResourceUrl(relativePath);
    }

    /**
     * 上传文件到 SFTP 服务器（File 重载）
     */
    private String uploadFile(File file, String originalFilename, String category) throws Exception {
        // 生成文件名
        String extension = originalFilename != null && originalFilename.contains(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".mp3";
        String filename = UUID.randomUUID().toString().replace("-", "") + extension;

        // 生成日期路径
        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        String datePath = now.format(formatter);

        // 远程目录路径
        String remoteDir = sftpConfig.getBaseDirectory() + "/" + category + "/" + datePath;
        String remoteFileName = filename;

        // 上传到 SFTP
        String finalRemoteDir = remoteDir;
        String finalRemoteFileName = remoteFileName;
        long fileSize = file.length();

        executeSftp(channel -> {
            try {
                // 创建远程目录
                createRemoteDirectory(channel, finalRemoteDir);

                // 上传文件
                try (InputStream inputStream = new FileInputStream(file)) {
                    channel.put(inputStream, finalRemoteFileName);
                }

                log.info("文件上传成功：remoteDir={}, filename={}, size={}",
                        finalRemoteDir, finalRemoteFileName, fileSize);

                return null;
            } catch (Exception e) {
                throw new SftpException(ChannelSftp.SSH_FX_FAILURE, e.getMessage());
            }
        });

        // 构建返回的 URL
        String relativePath = category + "/" + datePath + "/" + filename;
        return buildResourceUrl(relativePath);
    }

    /**
     * 创建远程目录（递归）
     */
    private void createRemoteDirectory(ChannelSftp channel, String path) throws SftpException {
        String[] dirs = path.split("/");
        StringBuilder currentPath = new StringBuilder();

        for (String dir : dirs) {
            if (dir.isEmpty()) {
                currentPath.append("/");
                continue;
            }
            currentPath.append("/").append(dir);

            try {
                channel.cd(currentPath.toString());
            } catch (SftpException e) {
                if (e.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                    // 目录不存在，创建它
                    channel.mkdir(currentPath.toString());
                    log.debug("创建远程目录：{}", currentPath);
                } else {
                    throw e;
                }
            }
        }
    }

    /**
     * 构建资源访问 URL
     */
    private String buildResourceUrl(String relativePath) {
        String baseUrl = sftpConfig.getBaseUrl();

        if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
            // 完整的 CDN URL
            return baseUrl.endsWith("/")
                ? baseUrl + relativePath
                : baseUrl + "/" + relativePath;
        } else {
            // 相对路径
            return baseUrl + "/" + relativePath;
        }
    }

    @Override
    public void deleteResource(String url) {
        try {
            // 从 URL 提取相对路径
            String relativePath = urlToRelativePath(url);
            if (relativePath == null) {
                log.warn("无法从 URL 提取路径：{}", url);
                return;
            }

            String remotePath = sftpConfig.getBaseDirectory() + "/" + relativePath;

            executeSftp(channel -> {
                try {
                    channel.rm(remotePath);
                    log.info("SFTP 文件删除成功：{}", remotePath);
                } catch (SftpException e) {
                    if (e.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                        log.warn("SFTP 文件不存在：{}", remotePath);
                    } else {
                        throw e;
                    }
                }
                return null;
            });

        } catch (Exception e) {
            log.error("SFTP 文件删除失败：url={}", url, e);
        }
    }

    /**
     * 将 URL 转换为相对路径
     */
    private String urlToRelativePath(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }

        String baseUrl = sftpConfig.getBaseUrl();

        // 处理完整 URL
        if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
            if (url.startsWith(baseUrl)) {
                return url.substring(baseUrl.length());
            }
        } else {
            // 相对路径
            if (url.startsWith(baseUrl)) {
                return url.substring(baseUrl.length());
            }
            if (url.startsWith("/" + baseUrl)) {
                return url.substring(baseUrl.length() + 1);
            }
        }

        return url;
    }

    /**
     * 下载文件（供下载控制器使用）
     *
     * @param relativePath 相对于 baseDirectory 的路径
     * @return 输入流
     */
    public InputStream downloadFile(String relativePath) throws Exception {
        String remotePath = sftpConfig.getBaseDirectory() + "/" + relativePath;

        return executeSftp(channel -> {
            try {
                // 确保目录存在
                String dir = remotePath.substring(0, remotePath.lastIndexOf("/"));
                channel.cd(dir);

                // 下载文件到临时文件
                File tempFile = File.createTempFile("sftp_", "_" + Paths.get(remotePath).getFileName().toString());

                try {
                    channel.get(remotePath, tempFile.getAbsolutePath());

                    // 读取并返回输入流
                    return new FileInputStream(tempFile) {
                        @Override
                        public void close() throws IOException {
                            super.close();
                            // 删除临时文件
                            if (tempFile.exists()) {
                                tempFile.delete();
                            }
                        }
                    };
                } catch (Exception e) {
                    tempFile.delete();
                    throw e;
                }

            } catch (Exception e) {
                throw new SftpException(ChannelSftp.SSH_FX_FAILURE, e.getMessage());
            }
        });
    }
}
