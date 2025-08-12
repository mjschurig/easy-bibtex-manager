# BibTeX Manager

A modern, single-file bibliography manager that runs entirely in your web browser. Just copy `index.html` to your computer and open it - no installation, no setup, no internet required!

## 🚀 Quick Start

### 🌐 Try It Online (Easiest Way!)

**Start managing your BibTeX files right now:**
👉 **[Open BibTeX Manager](https://bibtex.equana.org/)** 👈

Simply click the link above and you can immediately:
- Upload your `.bib` files using the "Open File" button
- Edit, filter, and manage your bibliography entries
- Download your updated bibliography when done
- No installation or setup required!

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