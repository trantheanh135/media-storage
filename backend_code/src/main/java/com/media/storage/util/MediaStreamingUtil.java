package com.media.storage.util;

import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.List;

public class MediaStreamingUtil {

    // A media file's bytes never change after upload (no edit-in-place, IDs
    // are never reused), so it's safe - and important for perceived
    // performance - to let the browser cache it indefinitely. Without this,
    // the grid thumbnail and the preview modal (same URL, moments apart)
    // each re-download the full file from scratch, and so does every repeat
    // visit to the same page.
    private static final String CACHE_CONTROL_VALUE = "private, max-age=31536000, immutable";

    public static ResponseEntity<ResourceRegion> stream(String filePath, String contentType, List<HttpRange> ranges) throws IOException {
        UrlResource resource = new UrlResource(Paths.get(filePath).toUri());
        long contentLength = resource.contentLength();

        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;

        if (ranges.isEmpty()) {
            ResourceRegion region = new ResourceRegion(resource, 0, contentLength);
            return ResponseEntity.status(HttpStatus.OK)
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_VALUE)
                    .body(region);
        }

        HttpRange range = ranges.get(0);
        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);
        long rangeLength = end - start + 1;

        ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_VALUE)
                .body(region);
    }
}
