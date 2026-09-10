# SV PLAST — Official Website

High-performance, production-grade website for **SV PLAST (Ultra-Fine 200-Mesh Iranian Gypsum Plaster)**.

---

## 🚀 Hosting on Vercel

This project is pre-configured with `vercel.json` for global Edge CDN caching (1-year immutable caching for 4K animation frames) and enterprise security headers.

### Method 1: Instant Deploy via CLI (1 Minute)

Run the following command in this project root:

```bash
npx vercel
```

1. Authenticate with your Vercel account in the browser when prompted.
2. Accept the defaults by pressing **Enter**:
   - Set up and deploy? **Y**
   - Which scope? **[Your Account]**
   - Link to existing project? **N**
   - Project name? **svplast**
   - In which directory? **./**
3. Once preview is ready, deploy directly to production with:
   ```bash
   npx vercel --prod
   ```
   or:
   ```bash
   npm run deploy
   ```

---

### Method 2: Deploy via GitHub (Continuous Deployment)

1. Create a new repository on [GitHub](https://github.com/new) named `svplast`.
2. Push this local git repository to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/svplast.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new).
4. Click **Import** next to your `svplast` repository.
5. Keep the default settings (Framework Preset: **Other**) and click **Deploy**.
6. Vercel will deploy your site and provide a free SSL-secured `https://svplast.vercel.app` domain.

---

## 🛠 Local Development

To test locally with live server:

```bash
npm start
# or
npm run dev
```

---

## 📁 Project Architecture

- **`index.html`**: Semantic HTML5 structure, SEO rich snippets, 64px compact navbar, interactive cost calculator, and embedded Google Maps footer.
- **`css/style.css`**: Zero-dependency, responsive styles strictly matching the official logo brand colors (`#2b9e37`, `#050805`, `#ffffff`).
- **`js/scroll-canvas.js`**: 4K 58-frame continuous canvas metamorphosis controller with sub-frame interpolation and zero idle GPU consumption.
- **`js/main.js`**: Mobile navigation, interactive plaster cost calculator, Google Maps link, and smooth scrolling.
- **`vercel.json`**: Edge CDN rules and HTTP security headers.
- **`images/`**: 58 4K frames (`frame_001.jpg` to `frame_058.jpg`), brand logo, and showcase imagery.
