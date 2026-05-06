# AutomatedScript Report

AutomatedScript Report is a lightweight, customizable graphical HTML reporting library for test automation frameworks like Selenium and Playwright.

---

## 🚀 Features

* 📊 Beautiful HTML reports
* 📸 Screenshot support
* 🧪 TestNG integration
* 🔄 Execution history tracking
* ⚡ Lightweight and fast

---

## 📦 Installation

### Maven

```xml
<dependency>
  <groupId>io.github.automated-script</groupId>
  <artifactId>automatedscript-report</artifactId>
  <version>1.0.0</version>
</dependency>
```

---

## 🛠 Usage Example

```java
AutoScriptReporter reporter = AutoScriptReporter.create("reports");

reporter.metaProject("My Project")
        .metaSuite("Smoke Tests")
        .executedBy("Mahesh");

TestCase test = reporter.createTest("TC01", "Login Test");
test.pass("Login successful");

reporter.flush();
```

---

## 📂 Output

* Generates HTML report in `/reports` directory
* Includes screenshots and execution details

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

This project is licensed under the MIT License.
