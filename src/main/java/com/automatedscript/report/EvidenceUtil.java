package com.automatedscript.report;

import com.automatedscript.report.model.Evidence;
import com.automatedscript.report.model.EvidenceRef;

import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;

import static com.automatedscript.report.util.FileUtil.copyFileTo;

public class EvidenceUtil {

    /**
     * Copies an external file into report's evidence folder and returns a URL usable by the UI.
     * Returned URL is relative: ./evidence/&lt;file&gt;
     */
    public static Evidence screenshot(Path reportDir, String title, Path sourceFile) {
        Evidence ev = new Evidence();
        try {
            String name = "screenshot_" + UUID.randomUUID().toString().substring(0,8) + "_" + sourceFile.getFileName();
            Path dest = reportDir.resolve("evidence").resolve(name);
            copyFileTo(sourceFile, dest);
            ev.screenshots.add(new EvidenceRef(title, "./evidence/" + name));
        } catch (IOException e) {
            // If copy fails, still keep original path reference
            ev.screenshots.add(new EvidenceRef(title, sourceFile.toString()));
        }
        return ev;
    }

    public static Evidence video(Path reportDir, Path sourceFile) {
        Evidence ev = new Evidence();
        try {
            String name = "video_" + UUID.randomUUID().toString().substring(0,8) + "_" + sourceFile.getFileName();
            Path dest = reportDir.resolve("evidence").resolve(name);
            copyFileTo(sourceFile, dest);
            ev.video = "./evidence/" + name;
        } catch (IOException e) {
            ev.video = sourceFile.toString();
        }
        return ev;
    }
}
