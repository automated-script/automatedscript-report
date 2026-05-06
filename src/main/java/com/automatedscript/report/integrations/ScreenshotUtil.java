package com.automatedscript.report.integrations;

import com.automatedscript.report.EvidenceUtil;
import com.automatedscript.report.model.Evidence;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

public class ScreenshotUtil {
    public static Evidence capture(WebDriver driver, Path reportDir, String title) {
        try {
            if (driver instanceof TakesScreenshot) {
                byte[] bytes = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                Path tmp = Files.createTempFile("as_shot_" + UUID.randomUUID().toString().substring(0,8), ".png");
                Files.write(tmp, bytes);
                return EvidenceUtil.screenshot(reportDir, title, tmp);
            }
        } catch (Exception ignored) {}
        return null;
    }
}
