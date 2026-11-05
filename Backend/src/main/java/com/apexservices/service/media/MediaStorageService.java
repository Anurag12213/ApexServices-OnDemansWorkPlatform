package com.apexservices.service.media;

import java.io.InputStream;

public interface MediaStorageService {

    /**
     * Upload an image from an input stream.
     * @param inputStream image binary stream
     * @param fileName original file name
     * @param contentType MIME type (e.g. image/jpeg, image/png, image/webp)
     * @param folder cloud storage target folder
     * @return permanent HTTPS delivery URL with WebP / auto-format transformations
     */
    String uploadImage(InputStream inputStream, String fileName, String contentType, String folder);

    /**
     * Upload an image from a byte array.
     */
    String uploadImage(byte[] imageBytes, String fileName, String contentType, String folder);

    /**
     * Upload a Base64 data URI string (e.g. "data:image/png;base64,...").
     * Decodes and validates the image before storage.
     * @return permanent HTTPS delivery URL
     */
    String uploadBase64Image(String base64DataUri, String folder, String publicIdPrefix);

    /**
     * Delete an image from cloud storage by its public URL or ID.
     */
    boolean deleteImage(String publicUrlOrId);

    /**
     * Check if cloud media storage (Cloudinary) is active and configured.
     */
    boolean isCloudStorageConfigured();
}
