# Plazen Status Page

A real-time status page for monitoring Plazen services.

## Features

- 🔄 Real-time status checks for all Plazen services
- 📊 Response time monitoring
- 🎨 Clean, modern dark theme UI
- 📱 Fully responsive design
- ⚡ Auto-refresh every 60 seconds
- 🖱️ Manual refresh capability

## Monitored Services

- **Plazen Website** - https://www.plazen.org
- **Plazen App** - https://plazen.org  
- **Images API** - https://images.plazen.org

## Development

### Running Locally

You can run the status page locally using any static file server:

```bash
# Using Python
cd public
python -m http.server 8080

# Using Node.js (npx serve)
npx serve public

# Using PHP
cd public
php -S localhost:8080
```

Then open http://localhost:8080 in your browser.

### Project Structure

```
public/
├── index.html    # Main HTML page
├── styles.css    # CSS styles
├── app.js        # JavaScript application logic
└── favicon.svg   # Site favicon
```

## Deployment

The `public/` directory can be deployed to any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- AWS S3 + CloudFront

## License

MIT License - see [LICENSE](LICENSE) for details