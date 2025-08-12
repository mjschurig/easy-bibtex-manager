# BibTeX Manager

A modern, single-file bibliography manager that runs entirely in your web browser. Just copy `index.html` to your computer and open it - no installation, no setup, no internet required!

## 🚀 Quick Start

### 🌐 Try It Online

**Start managing your BibTeX files right now:**
👉 **[Open BibTeX Manager](https://bibtex.equana.org/)** 👈

Simply click the link above and you can immediately:
- Upload your `.bib` files using the "Open File" button
- Edit, filter, and manage your bibliography entries
- Download your updated bibliography when done

**📚 For Semantic Scholar Features (Research Paper Import):**
To access the research paper import functionality, you need to enable CORS in your browser (see setup instructions below).

### 💾 Download for Offline Use

**For offline use or when you prefer local files:**

1. **Download**: Get the latest `index.html` from [GitHub Releases](https://github.com/mjschurig/easy-bibtex-manager/releases/)
2. **Save**: Place `index.html` anywhere on your computer
3. **Open**: Double-click `index.html` to open it in your browser
4. **Load**: Use the "Open File" button to select your `.bib` file(s)

### File Management

**Loading files**:
- Use the "Open File" button to select your `.bib` file from anywhere on your computer
- The application works with files from any location - no need to place them in the same folder

**Try it now**: This repository includes `index.html` and `example.bib` - clone or download the repo and open `index.html` to see it in action!

## 🔧 Semantic Scholar Research Paper Import Setup

To use the **Semantic Scholar research paper import** feature, you need to enable CORS (Cross-Origin Resource Sharing) in your browser. This is required because browsers block requests to external APIs for security reasons.

### 🚀 Quick Setup (Recommended)

**Option 1: Browser Extension (Easiest)**

1. **Install a CORS extension:**
   - **Chrome**: Install [CORS Unblock](https://chromewebstore.google.com/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino) or [Allow CORS](https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf)
   - **Firefox**: Install [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)
   - **Edge**: Install [CORS Unblock](https://microsoftedge.microsoft.com/addons/detail/cors-unblock/hkjklmhkbkdhlgnnfbbcihcajofmjgbh)

2. **Enable the extension:**
   - Click the extension icon in your browser toolbar
   - Toggle it ON for the BibTeX Manager website
   - The icon should show as "enabled" or "green"

3. **Refresh the page and try importing papers!**

**Option 2: Command Line Browser (For Advanced Users)**

If you prefer not to use extensions, you can launch your browser with CORS disabled:

```bash
# Chrome/Chromium
google-chrome --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir=/tmp/chrome-cors

# Windows Chrome
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir=c:\temp\chrome-cors

# macOS Chrome
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome-cors" --disable-web-security --disable-features=VizDisplayCompositor
```

### ⚠️ Important Security Notes

- **Only enable CORS for trusted websites** like this BibTeX Manager
- **Disable the extension when browsing other websites** to maintain security
- **Never enable CORS for banking or sensitive websites**
- The browser command line method opens a separate browser instance - use only for this application

### 🔍 Troubleshooting

**If you see CORS errors:**

1. **Check extension status**: Make sure the CORS extension is enabled (green/active)
2. **Refresh the page**: After enabling CORS, refresh the BibTeX Manager page
3. **Try different extension**: Some extensions work better with different browsers
4. **Check browser console**: Press F12 → Console tab to see detailed error messages

**Common error messages:**
- "CORS Error: Unable to access Semantic Scholar API"
- "Failed to fetch" 
- "Access-Control-Allow-Origin" errors

All of these indicate CORS needs to be enabled.

### 📚 Why is CORS needed?

Modern browsers prevent websites from making requests to other domains (like Semantic Scholar's API) for security. While this protects users from malicious websites, it also blocks legitimate use cases like ours. CORS extensions safely allow these requests for specific websites you trust.

## 👨‍💻 Development Setup

### For Developers

```bash
# Clone the repository
git clone https://github.com/mjschurig/easy-bibtex-manager
cd easy-bibtex-manager

# Install dependencies (using pnpm)
pnpm install

# Start development server
pnpm run dev

# Build single-file application
pnpm run build

# Type checking
pnpm run type-check
```

## 📦 Creating a Release

Releases are automatically created when version tags are pushed to the repository. Each release includes:

- **Ready-to-use `index.html`** - Download and use immediately
- **Automatic builds** - Triggered by version tags (e.g., `v1.0.0`)
- **GitHub Pages deployment** - Live demo automatically deployed
- **Release notes** - Feature highlights and technical notes

### Creating a Release

```bash
# Tag a new version
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Build the application using pnpm
# 2. Deploy to GitHub Pages
# 3. Create a GitHub release
# 4. Attach index.html as release asset
```

### Release Workflow

The automated release process:

1. **Triggers** on version tags (`v*`)
2. **Builds** the application with pnpm
3. **Deploys** to GitHub Pages for live demo
4. **Creates** GitHub release with downloadable `index.html`
5. **Includes** release notes with demo link and download instructions

**Repository Settings Required:**
- Go to **Settings** → **Pages** 
- Set **Source** to "GitHub Actions"

---

**Made with ❤️ for researchers and academics**