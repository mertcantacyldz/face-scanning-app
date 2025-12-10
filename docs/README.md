# Privacy Policy & Terms of Service - README

## 📁 What's in the `docs` Folder

This folder contains professional Privacy Policy and Terms of Service pages for App Store and Google Play compliance.

### Files:
- **index.html** - Landing page with links to legal pages
- **privacy.html** - Comprehensive Privacy Policy (GDPR & CCPA compliant)
- **terms.html** - Detailed Terms of Service
- **styles.css** - Modern, responsive styling
- **INTEGRATION_EXAMPLE.tsx** - React Native components for using these links in your app

---

## 🚀 Quick Start

### 1. Deploy to GitHub Pages

```bash
# Commit and push if not done yet
git add docs/
git commit -m "Add legal pages"
git push origin main

# Enable GitHub Pages in repo settings:
# Settings → Pages → Source: main branch, /docs folder
```

### 2. Your URLs will be:
```
https://[your-username].github.io/face-scanning-app/
https://[your-username].github.io/face-scanning-app/privacy.html
https://[your-username].github.io/face-scanning-app/terms.html
```

### 3. Update URLs in App

Edit `INTEGRATION_EXAMPLE.tsx` and replace:
```typescript
const PRIVACY_URL = 'https://[your-username].github.io/face-scanning-app/privacy.html';
const TERMS_URL = 'https://[your-username].github.io/face-scanning-app/terms.html';
```

---

## 📱 Add to Your App Store Listings

### Apple App Store
- **Privacy Policy URL**: Use your GitHub Pages privacy.html URL
- **Support URL**: Use your GitHub Pages index.html URL

### Google Play
- **Privacy Policy**: Add your privacy.html URL in Store Presence settings

---

## ✏️ Customization

### Update App Name
When you have your final app name, search and replace in all HTML files:
- Find: `Face Scanning App`
- Replace: `Your New App Name`

### Update Contact Emails
Replace placeholder emails in privacy.html and terms.html:
- `privacy@facescanningapp.com` → your actual email
- `support@facescanningapp.com` → your actual email

### Customize Colors
Edit `styles.css` to match your brand colors.

---

## 📖 Documentation

See `GITHUB_PAGES_SETUP.md` (in artifacts) for detailed setup instructions and integration examples.

---

## ✅ Compliance Checklist

Our pages include:
- ✅ GDPR compliance (EU users)
- ✅ CCPA compliance (California users)
- ✅ Children's privacy protection (COPPA)
- ✅ Data collection transparency
- ✅ Third-party services disclosure
- ✅ User rights and data deletion
- ✅ Subscription and payment terms
- ✅ AI/face scanning disclaimers

---

## 🔄 Updating After Deployment

Just edit the HTML files and push to GitHub. Changes go live automatically in ~1 minute!

```bash
# Make changes to HTML files
git add docs/
git commit -m "Update legal pages"
git push origin main
# Wait ~1 minute for GitHub Pages to update
```

---

## 🎯 Next Steps

1. ✅ Created - HTML pages are ready
2. ⏳ Deploy - Push to GitHub and enable Pages
3. ⏳ Customize - Update app name and contact emails
4. ⏳ Integrate - Add links to your React Native app
5. ⏳ Submit - Include URLs in App Store/Play Store listings

---

**Need Help?** Check the detailed guide in artifacts or ask me! 🚀
