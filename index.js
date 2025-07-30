const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://wise.com/us/send-money/send-money-to-bangladesh', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await page.waitForSelector('input.np-input', { timeout: 30000 });

    await page.evaluate(() => {
      const input = document.querySelector('input.np-input');
      if (input) input.value = '';
    });

    await page.type('input.np-input', '1005');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const feeText = await page.evaluate(() => {
      const allSpans = Array.from(document.querySelectorAll('span'));
      const match = allSpans.find(span => span.textContent.includes('Total included fees') && span.textContent.includes('%'));
      return match ? match.textContent : null;
    });

    if (!feeText) throw new Error('Could not find fee text');

    const feeMatch = feeText.match(/\(([\d.]+)%\)/);
    const feePercent = feeMatch ? feeMatch[1] : 'N/A';

    res.json({ fee_percent: feePercent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Wise Fee Scraper running on port ${PORT}`);
});
