const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();

// CORS Fix (Website se request block na ho)
app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate-pdf', async (req, res) => {
    const { htmlContent } = req.body;

    if (!htmlContent) {
        return res.status(400).send('HTML content is required');
    }

    try {
        // Render ke liye Chrome settings
        const browser = await puppeteer.launch({
            headless: "new",
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process', // Render ki 512MB RAM mein crash bachane ke liye
                '--no-zygote'
            ]
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Taaki Google Docs ke colors aayein
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('Error generating PDF');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`PDF Server running on port ${PORT}`);
});
