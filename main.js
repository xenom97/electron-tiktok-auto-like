const { app, BrowserWindow, ipcMain, ipcRenderer } = require("electron");
const puppeteer = require("puppeteer");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.on("login", async (event, credentials) => {
    const { username, password, total, delay } = credentials;
    await loginWithPuppeteer({
      username,
      password,
      total: +total,
      delay: +delay,
    });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

const findElementByText = async ({ page, text, tag = "p" }) => {
  try {
    await page.waitForXPath(`//${tag}[contains(., "${text}")]`);
    const elements = await page.$x(`//${tag}[contains(., "${text}")]`);
    return elements.length > 0 ? elements[0] : null;
  } catch (error) {
    console.log("Error finding element by text:", error?.message);
    return null;
  }
};

const findElementByPlaceholder = async ({ page, placeholder }) => {
  try {
    await page.waitForXPath(`//input[@placeholder="${placeholder}"]`);
    const elements = await page.$x(`//input[@placeholder="${placeholder}"]`);
    return elements.length > 0 ? elements[0] : null;
  } catch (error) {
    console.log("Error finding element by placeholder:", error?.message);
    return null;
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loginWithPuppeteer = async ({
  username,
  password,
  total,
  delay: delayPerPost,
}) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-notifications", "--start-maximized"],
  });
  const page = await browser.newPage();

  const { screenWidth, screenHeight } = await page.evaluate(() => {
    return {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
  });

  await page.setViewport({
    width: screenWidth,
    height: screenHeight,
  });

  await page.goto("https://www.tiktok.com");

  const loginButton = await page.$("#header-login-button");
  if (loginButton) {
    await loginButton.click();
  }

  await page.waitForSelector("#login-modal");

  await delay(2000);

  const loginWithPhoneOrEmail = await findElementByText({
    page,
    text: "Use phone / email / username",
  });
  if (loginWithPhoneOrEmail) {
    await loginWithPhoneOrEmail.click();
  }
  const loginWithEmailOrUsername = await findElementByText({
    page,
    text: "Log in with email or username",
    tag: "a",
  });

  if (loginWithEmailOrUsername) {
    await loginWithEmailOrUsername.click();
  }
  const inputUsernameElement = await findElementByPlaceholder({
    page,
    placeholder: "Email or username",
  });
  if (inputUsernameElement) {
    await inputUsernameElement.click();
    await page.keyboard.type(username);
  }
  const inputPasswordElement = await findElementByPlaceholder({
    page,
    placeholder: "Password",
  });
  if (inputPasswordElement) {
    await inputPasswordElement.click();
    await page.keyboard.type(password);
    await page.keyboard.press("Enter");
  }

  await page.waitForNavigation();

  const headerLoginButton = await page.$("#header-login-button");

  if (!headerLoginButton) {
    await page.goto("https://www.tiktok.com");

    for (let i = 0; i < total; i++) {
      await delay(delayPerPost * 1000);
      await page.keyboard.press("l");
      await delay(1000);
      await page.keyboard.press("ArrowDown");
    }
  } else {
    console.log("User is not logged in");

    const message = await findElementByText({
      page,
      text: "Maximum number of attempts reached. Try again later.",
      tag: "span",
    });

    if (message) {
      console.log("Login failed due to too many attempts");
      return;
    }
  }
};
