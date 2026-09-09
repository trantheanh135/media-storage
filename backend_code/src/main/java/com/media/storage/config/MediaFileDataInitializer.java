package com.media.storage.config;

import com.media.storage.model.MediaFile;
import com.media.storage.repository.MediaFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

// The project has no migration tool (ddl-auto=update), so files that existed
// before the favorite/randomOrder columns were added come back with
// randomOrder = null. Assign them a value once on startup so they sort
// correctly alongside newly-uploaded files.
@Component
@RequiredArgsConstructor
@Slf4j
public class MediaFileDataInitializer implements CommandLineRunner {

    private final MediaFileRepository mediaFileRepository;

    @Override
    public void run(String... args) {
        List<MediaFile> filesMissingRandomOrder = mediaFileRepository.findByRandomOrderIsNull();
        if (filesMissingRandomOrder.isEmpty()) {
            return;
        }

        for (MediaFile mediaFile : filesMissingRandomOrder) {
            mediaFile.setRandomOrder(Math.random());
            if (mediaFile.getFavorite() == null) {
                mediaFile.setFavorite(false);
            }
        }
        mediaFileRepository.saveAll(filesMissingRandomOrder);
        log.info("Backfilled randomOrder for {} existing media file(s)", filesMissingRandomOrder.size());
    }
}
