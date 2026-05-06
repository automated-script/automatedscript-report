package com.automatedscript.report.integrations;

import org.openqa.selenium.WebDriver;

public class DriverManager {
    private static final ThreadLocal<WebDriver> TL = new ThreadLocal<>();
    public static void setDriver(WebDriver driver) { TL.set(driver); }
    public static WebDriver getDriver() { return TL.get(); }
    public static void removeDriver() { TL.remove(); }
}
