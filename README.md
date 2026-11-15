# Imtihon testlari (static sayt)

Backendsiz, oddiy HTML/CSS/JS test sayti. GitHub Pages orqali ishlaydi.

- `index.html` — dashboard (fanlar ro'yxati, statistikalar)
- `test.html?s=<fan_id>` — test sahifasi: javob belgilanganda to'g'ri/xato darhol ko'rsatiladi, oxirida umumiy natija va tahlil
- `data/subjects.js` — fanlar ro'yxati
- `data/<fan_id>.js` — fan savollari

## Yangi fan qo'shish

1. Word faylni tayyorlang: har bir savol oldidan `+++++`, variantlar orasida `=====`, to'g'ri javob oldida `#`.
2. O'giring:
   ```
   pip install python-docx
   python tools/docx_to_js.py Fan_Test.docx fan2
   ```
3. `data/subjects.js` da shu fanni `id: "fan2"`, `name`, `ready: true` qilib yangilang.
4. Commit + push — GitHub Pages avtomatik yangilanadi.
