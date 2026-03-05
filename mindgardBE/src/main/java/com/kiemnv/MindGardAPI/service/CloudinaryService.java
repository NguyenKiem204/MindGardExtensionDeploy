package com.kiemnv.MindGardAPI.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload an audio file to Cloudinary.
     * Cloudinary uses resource_type "video" for audio files.
     *
     * @param file the audio file to upload
     * @return the secure URL of the uploaded file
     */
    public String uploadAudio(MultipartFile file) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", "video",
                "folder", "mindgard/audio",
                "allowed_formats", "mp3,wav,ogg,m4a,flac,aac"
        ));
        String secureUrl = (String) result.get("secure_url");
        log.info("Uploaded audio to Cloudinary: {}", secureUrl);
        return secureUrl;
    }

    /**
     * Delete an audio file from Cloudinary by its public ID.
     */
    public void deleteAudio(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                "resource_type", "video"
        ));
        log.info("Deleted audio from Cloudinary: {}", publicId);
    }
}
