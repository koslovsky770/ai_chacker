# AI Visibility Checker

בודק אם עסק מופיע בהמלצות של **ChatGPT (OpenAI)**, **Gemini (Google)** ו-**Claude (Anthropic)**
כאשר לקוחות פוטנציאליים מחפשים שירות מהסוג שהעסק מציע - בלי להזכיר את שם העסק בשאילתות עצמן.

## תוכן עניינים

1. [ארכיטקטורה](#ארכיטקטורה)
2. [מבנה הפרויקט](#מבנה-הפרויקט)
3. [הרצה מקומית](#הרצה-מקומית)
4. [משתני סביבה](#משתני-סביבה)
5. [יצירת API keys](#יצירת-api-keys)
6. [פריסה ל-Vercel](#פריסה-ל-vercel)
7. [הקמת MySQL ב-cPanel](#הקמת-mysql-ב-cpanel)
8. [הרצת קובץ ה-SQL](#הרצת-קובץ-ה-sql)
9. [העלאת ה-PHP Database API ל-cPanel](#העלאת-ה-php-database-api-ל-cpanel)
10. [חיבור בין Vercel ל-cPanel](#חיבור-בין-vercel-ל-cpanel)
11. [כניסה לאזור הניהול](#כניסה-לאזור-הניהול)
12. [הפעלת MOCK_AI](#הפעלת-mock_ai)
13. [החלפת מודלים](#החלפת-מודלים)
14. [שינוי מספר השאילתות](#שינוי-מספר-השאילתות)
15. [אבטחה](#אבטחה)
16. [הרחבות עתידיות](#הרחבות-עתידיות)

---

## ארכיטקטורה

```
Vercel / Next.js  →  HTTPS + X-Api-Secret  →  cPanel PHP API  →  Local MySQL
```

- **Next.js (Vercel)** מריץ את כל ה-UI, את קריאות ה-AI (OpenAI/Gemini/Anthropic - המפתחות
  קיימים רק בצד השרת, אף פעם לא נחשפים לדפדפן) ואת שכבת ה-API הפנימית של האפליקציה.
- Vercel **לא** מתחבר ישירות ל-MySQL. כל פעולת קריאה/כתיבה עוברת דרך שכבת ה-PHP הנפרדת
  בתיקיית `cpanel-api/`, שמתחברת ל-MySQL מקומית בתוך שרת ה-cPanel ומאמתת כל בקשה מול סוד
  משותף (`X-Api-Secret`).
- **חשוב - עיבוד הבדיקה בפועל:** בדיקת AI מלאה (עד 10 שאילתות × 3 מנועים = עד 30 קריאות)
  יכולה לקחת יותר זמן ממה ש-Vercel Serverless Function בודדת מאפשרת (בייחוד בתוכנית Hobby).
  לכן הבחירה הארכיטקטונית כאן היא **עיבוד בצעדים קטנים (batch) שמונע מהדפדפן**:

  1. `POST /api/audits` יוצר את הבדיקה (business + audit + כל השאילתות + "placeholders" לכל
     תוצאה) ומחזיר מיד `auditId`, בלי לבצע אף קריאת AI.
  2. הדפדפן עובר למסך טעינה (`/audit/[id]/running`) ומבצע polling כל ~1.8 שניות אל
     `POST /api/audits/[id]/process`.
  3. כל קריאה כזו מעבדת **batch קטן** (`PROCESS_BATCH_SIZE`, ברירת מחדל 4) של בדיקות שממתינות,
     במקביל מוגבל (`AI_CONCURRENCY`), שומרת את התוצאות ב-MySQL (דרך ה-PHP API) ומחזירה את
     מצב ההתקדמות האמיתי (`completed`/`total`).
  4. כשאין יותר בדיקות ממתינות, ה-audit מסומן `completed` עם ציון סופי, והדפדפן עובר לדוח.

  כך כל קריאת שרת בודדת קצרה וחסינה ל-timeout, ללא תלות בתוכנית Vercel. אם משדרגים ל-Pro/
  Enterprise אפשר להגדיל את `PROCESS_BATCH_SIZE`/`AI_CONCURRENCY` ואת `maxDuration` בקובץ
  `app/api/audits/[id]/process/route.ts` כדי לעבד יותר בכל טיק.

- דוח שנוצר פעם אחת **לא רץ שוב**: פתיחת `/report/[auditId]` בכל זמן קוראת את התוצאות ששמורות
  ב-MySQL בלבד, בלי לבצע קריאות AI נוספות.

## מבנה הפרויקט

```
app/                       # Next.js App Router
  page.tsx                 # Landing page
  check/                   # אשף פרטי ליד + עסק
  audit/[id]/running/      # מסך התקדמות (polling)
  report/[id]/             # דוח ציבורי לפי מזהה בדיקה
  admin/                   # אזור ניהול מוגן בסיסמה
  api/                     # Route handlers (leads, audits, admin)
components/
  ui/                      # רכיבי בסיס (Button, Card, Field...)
  wizard/                  # טופס רב-שלבי
  progress/                # מסך טעינה
  report/                  # רכיבי הדוח
  admin/                   # רכיבי אזור הניהול
lib/
  config.ts                # קונפיגורציה מרכזית - שמות מודלים, כמות שאילתות, concurrency
  db.ts                    # קליינט טיפוסי ל-cPanel PHP API (השכבה היחידה שנוגעת ב"DB")
  providers/                # openai.ts / gemini.ts / anthropic.ts / mock.ts + index.ts (dispatcher)
  queries/generate.ts       # יצירת שאילתות "כמו לקוח" (6 קטגוריות)
  analysis.ts               # זיהוי mentioned/recommended/position/מתחרים מתוך טקסט חופשי
  normalize.ts               # נרמול שמות/דומיינים לזיהוי וריאציות כתיב
  scoring.ts / aggregate.ts  # ציון נראות שקוף + ריכוז מתחרים/מקורות
  audit-runner.ts            # "הטיק" שמריץ batch אחד של הבדיקה
cpanel-api/                 # PHP API עצמאי להעלאה ל-cPanel (לא נבנה עם Next.js)
  api.php                   # נקודת כניסה יחידה (router)
  actions/*.php             # פעולות DB לפי משאב
  migrations/001_init.sql   # סכימת MySQL מלאה
  config.example.php        # תבנית להגדרות (להעתיק ל-config.php בשרת)
```

## הרצה מקומית

```bash
npm install
cp .env.example .env.local
# ערכו את .env.local: לפחות MOCK_AI=true + ADMIN_SECRET, ראו הסבר למטה
npm run dev
```

האתר יעלה בכתובת http://localhost:3000.

> **שימו לב:** גם עם `MOCK_AI=true` (שמדמה את קריאות ה-AI), האפליקציה עדיין צריכה שכבת DB
> אמיתית (`DATABASE_API_URL` + `DATABASE_API_SECRET`) כדי לשמור לידים/עסקים/בדיקות - זהו
> ה"מקור אמת" היחיד. לפיתוח מקומי מלא יש שתי אפשרויות:
> 1. להצביע `DATABASE_API_URL` על שרת ה-cPanel האמיתי (גם בסביבת פיתוח - זו סתם קריאת HTTPS).
> 2. להריץ את ה-PHP API מקומית מול MySQL מקומי:
>    ```bash
>    # יש MySQL רץ מקומית עם הסכימה מ-cpanel-api/migrations/001_init.sql
>    LOCAL_DB_NAME=ai_chacker LOCAL_DB_USER=root LOCAL_DB_PASS=yourpass \
>      php -S localhost:8080 -t cpanel-api
>    # ואז ב-.env.local:
>    # DATABASE_API_URL=http://localhost:8080/api.php
>    # DATABASE_API_SECRET=dev-secret-change-me   (כברירת מחדל בקובץ cpanel-api/config.php)
>    ```
>    `cpanel-api/config.php` בגרסת הפיתוח כבר מוגדר לקרוא מ-`LOCAL_DB_*` env vars ולא מכיל
>    סודות אמיתיים - הוא **לא** קובץ הייצור (את קובץ הייצור מעלים בנפרד ידנית ל-cPanel, ראו
>    בהמשך).

## משתני סביבה

כל המשתנים מתועדים ב-`.env.example`. עיקריים:

| משתנה | תיאור |
|---|---|
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | מפתחות API של מודלי ה-AI (server-side בלבד) |
| `DATABASE_API_URL` | כתובת ה-`api.php` על שרת ה-cPanel |
| `DATABASE_API_SECRET` | סוד משותף בין Vercel ל-cPanel (חייב להיות זהה ל-`api_secret` ב-`cpanel-api/config.php`) |
| `APP_URL` | כתובת האפליקציה (למטא-דאטה/קישורים) |
| `ADMIN_SECRET` | סיסמת הכניסה לאזור הניהול |
| `MOCK_AI` | `true`/`false` - דילוג על קריאות AI אמיתיות בפיתוח |
| `FREE_QUERY_COUNT` / `FULL_QUERY_COUNT` / `ACTIVE_QUERY_COUNT` | כמות שאילתות לבדיקה (ראו [שינוי מספר השאילתות](#שינוי-מספר-השאילתות)) |
| `AI_CONCURRENCY` / `PROCESS_BATCH_SIZE` | מקביליות/גודל batch בעיבוד הבדיקה |
| `FULL_REPORT_CTA_URL` | לאן מוביל הכפתור "אני רוצה את הדוח המלא" בסוף הדוח |

## יצירת API keys

- **OpenAI** - https://platform.openai.com/api-keys, ודאו גישה למודל שהוגדר ב-`OPENAI_MODEL`
  (ברירת מחדל `gpt-4.1`) ושחשבון הארגון מאושר לשימוש בכלי `web_search`.
- **Anthropic (Claude)** - https://console.anthropic.com/settings/keys, ודאו ש-web search
  זמין לחשבון (`claude.ai/settings` / הגדרות ה-API).
- **Google Gemini** - https://aistudio.google.com/apikey. ה-Grounding with Google Search
  מופעל אוטומטית דרך ה-tool `googleSearch` בקוד.

## פריסה ל-Vercel

1. חברו את המאגר (repo) הזה לפרויקט חדש ב-Vercel.
2. הגדירו את כל משתני הסביבה מ-`.env.example` תחת Project Settings → Environment Variables
   (כולל `MOCK_AI=false` בפרודקשן, ומפתחות ה-AI האמיתיים).
3. `DATABASE_API_URL`/`DATABASE_API_SECRET` חייבים להצביע על שרת ה-cPanel שהוקם (ראו הסעיפים
   הבאים) - יש להקים אותו **לפני** ה-deploy הראשון לפרודקשן, אחרת שמירת לידים תיכשל.
4. Deploy. אין צורך בהגדרות build מיוחדות (`next build` רגיל).

## הקמת MySQL ב-cPanel

1. ב-cPanel → **MySQL Databases**: צרו מסד נתונים חדש (למשל `cpaneluser_aichecker`).
2. באותו עמוד צרו משתמש MySQL חדש עם סיסמה חזקה, והוסיפו אותו למסד עם **All Privileges**.
3. שמרו את שם המסד/משתמש/סיסמה - יידרשו בהמשך ב-`cpanel-api/config.php`.

## הרצת קובץ ה-SQL

בחרו אחת מהאפשרויות:

- **phpMyAdmin** (מומלץ, זמין כמעט בכל cPanel): פתחו את המסד שיצרתם → לשונית **Import** →
  בחרו את `cpanel-api/migrations/001_init.sql` → **Go**.
- **שורת פקודה** (אם יש גישת SSH):
  ```bash
  mysql -u cpaneluser_dbuser -p cpaneluser_aichecker < cpanel-api/migrations/001_init.sql
  ```

אם השרת ישן ולא תומך בטיפוס `JSON` (MySQL מתחת ל-5.7.8 / MariaDB מתחת ל-10.2.7), פתחו את
קובץ ה-SQL והחליפו כל `JSON` ב-`LONGTEXT` - שאר הקוד לא צריך לשינוי.

## העלאת ה-PHP Database API ל-cPanel

1. בתיקייה `cpanel-api/` בפרויקט: העתיקו את `config.example.php` ל-`config.php` ומלאו:
   - פרטי ה-DB (host/name/user/pass) מהסעיף הקודם.
   - `api_secret` - מחרוזת אקראית וארוכה (למשל `openssl rand -hex 32`).
   - `allowed_origins` - כתובת האפליקציה ב-Vercel (ה-production URL המדויק, כולל `https://`).
2. העלו את **כל** תיקיית `cpanel-api` (כולל `.htaccess` ו-`config.php` שיצרתם, **לא** כולל
   `config.example.php` אם רוצים - זה לא מזיק להשאיר) לשרת, למשל ל-`public_html/ai-checker-api/`
   (דרך File Manager או FTP/SFTP).
3. ודאו הרשאות קריאה רגילות לקבצים (644) והרשאות הרצה ל-PHP לפי ברירת המחדל של השרת (בד"כ
   PHP 8.x מופעל אוטומטית ב-cPanel מודרני; אם לא - הגדירו גרסת PHP תחת **MultiPHP Manager**).
4. `config.php` **חייב** להישאר מחוץ ל-git (הוא כבר ב-`.gitignore`) - הוא מכיל סודות אמיתיים.
5. בדקו שהכל עובד:
   ```bash
   curl -X POST "https://yourdomain.com/ai-checker-api/api.php?action=admin.stats" \
     -H "Content-Type: application/json" \
     -H "X-Api-Secret: YOUR_SECRET" \
     -d "{}"
   # אמור להחזיר: {"ok":true,"data":{"total_leads":0,...}}
   ```

## חיבור בין Vercel ל-cPanel

ב-Vercel Project Settings → Environment Variables הגדירו:

```
DATABASE_API_URL=https://yourdomain.com/ai-checker-api/api.php
DATABASE_API_SECRET=<אותו api_secret שהגדרתם ב-config.php>
```

ובצד ה-cPanel, ב-`config.php`, ודאו ש-`allowed_origins` כולל את כתובת ה-production
המדויקת של Vercel (וגם כתובת preview אם רוצים לבדוק deployments של branches).

## כניסה לאזור הניהול

1. הגדירו `ADMIN_SECRET` ב-environment variables (סיסמה חזקה, לא בקוד).
2. גשו ל-`/admin` - תועברו אוטומטית ל-`/admin/login` אם לא מחוברים.
3. לאחר הזנת הסיסמה מוגדר cookie חתום (HttpOnly, בתוקף ל-8 שעות). ניתן להתנתק בכפתור
   "התנתקות" באזור הניהול.

באזור הניהול: מספר לידים/בדיקות, טבלת לידים עם סינון לפי טווח תאריכים, ייצוא CSV, וקישור
לפתיחת הדוח המלא של כל בדיקה.

## הפעלת MOCK_AI

```
MOCK_AI=true
```

כשמוגדר, שום קריאת רשת אמיתית לא נשלחת ל-OpenAI/Gemini/Anthropic - `lib/providers/mock.ts`
מחזיר תשובות מדומות (עם וריאציה אקראית, כולל הזכרת העסק הנבדק בכ-1/3 מהמקרים כדי שאפשר
לבדוק גם את מסלול ה"הומלץ"). שימושי לפיתוח/עיצוב UI בלי לבזבז קרדיטים. ברירת המחדל היא
`false` - יש להגדיר את זה במפורש בסביבת הפיתוח.

## החלפת מודלים

כל שמות המודלים מרוכזים במקום אחד: `lib/config.ts` (אובייקט `PROVIDERS`), עם אפשרות override
דרך משתני סביבה בלי לגעת בקוד:

```
OPENAI_MODEL=gpt-4.1
GEMINI_MODEL=gemini-2.5-flash
ANTHROPIC_MODEL=claude-sonnet-4-5
```

אפשר גם לכבות ספק שלם זמנית (למשל אם יש בעיית API) בלי לגעת בקוד:

```
GEMINI_ENABLED=false
```

הבדיקה תמשיך לרוץ מול שני הספקים הנותרים בלבד, והציונים יחושבו בהתאם.

## שינוי מספר השאילתות

גם זה מרוכז ב-`lib/config.ts` וניתן ל-override מלא דרך env, בלי שינוי קוד:

```
FREE_QUERY_COUNT=5      # תוכנית חינמית עתידית
FULL_QUERY_COUNT=10     # תוכנית מלאה עתידית
ACTIVE_QUERY_COUNT=5    # מה שבפועל בשימוש היום ליצירת audit חדש
```

כשתרצו להפעיל תוכניות בתשלום, מספיק לשנות את המקור של `ACTIVE_QUERY_COUNT` (למשל
לפי plan שנשמר על ה-lead/business) - שאר המערכת (יצירת שאילתות, יצירת ה-`ai_results`
placeholders, חישוב ה-progress) כבר configurable ולא צריך לגעת בו.

## אבטחה

- כל תעבורה בין Vercel ל-cPanel דרך HTTPS בלבד + header `X-Api-Secret` (השוואה עם
  `hash_equals` למניעת timing attacks).
- כל שאילתת SQL ב-PHP משתמשת ב-**Prepared Statements** (`PDO::ATTR_EMULATE_PREPARES => false`).
- ולידציה לכל שדה קלט גם בצד ה-Next.js (Zod) וגם בצד ה-PHP (`validate.php`).
- CORS מוגבל לרשימת origins מפורשת (`allowed_origins` ב-`config.php`).
- אין חשיפת credentials של MySQL או API keys של מודלי AI לצד הלקוח - כל הקריאות הרגישות
  קורות אך ורק בצד השרת (Route Handlers / PHP), אף פעם לא ב-Client Components.
- שגיאות לא חושפות מידע פנימי - ה-PHP API מחזיר הודעות גנריות ורושם את הפרטים המלאים
  ל-`error_log` בלבד; כנ"ל בצד ה-Next.js.
- Rate limiting בסיסי מבוסס-קבצים לכל IP ב-PHP (`ratelimit.php`, ברירת מחדל 60 בקשות/דקה).
- `.htaccess` בתיקיית `cpanel-api` חוסם גישה ישירה לכל קובץ PHP פרט ל-`api.php`, וכן לקבצי
  `.sql`/`.md`.
- אזור הניהול מוגן בסוד יחיד (`ADMIN_SECRET`) עם עוגייה חתומה (HMAC) - מספיק ל-MVP; לפני
  שימוש רב-משתמשים כדאי לשדרג למערכת הרשאות מלאה.

## הרחבות עתידיות

הארכיטקטורה נבנתה כך שקל להוסיף בלי לשבור דברים קיימים:

- **בדיקה חוזרת שבועית/חודשית + השוואה לאורך זמן** - `audits` כבר מקושר ל-`business_id`
  (יחס one-to-many), כך שאפשר לשלוף היסטוריית audits לפי עסק ולהציג טרנד.
- **חשבון לקוח / תשלום / Free vs Pro** - `ACTIVE_QUERY_COUNT` כבר מופרד מ-`FREE_QUERY_COUNT`/
  `FULL_QUERY_COUNT`; מספיק לחבר אותו לשדה plan על ה-lead/business.
- **Weighting לפי מיקום בציון** - כל הלוגיקה בציון מרוכזת ב-`lib/scoring.ts` עם הערה מפורשת
  איפה להוסיף משקל לפי `position` בלי לפגוע במונים הגולמיים ("X מתוך Y") שצריכים להישאר כנים.
- **התראות על שינוי נראות / שליחת דוח במייל / PDF / webhook לרשימת תפוצה** - טבלת `leads`
  כבר כוללת `marketing_consent`, ומבנה ה-API (`lib/db.ts`) מאפשר להוסיף פעולות חדשות ב-PHP
  (`actions/`) בלי לגעת בקיימות.
- **CRM** - כל כתיבה עוברת דרך `cpanel-api/actions/*.php`, כך שקל להוסיף webhook יוצא בסוף
  כל `lead.create`/`audit.update` בלי לשנות את חוזה ה-API הקיים.

---

## סיכום מה שנבנה (בקצרה)

- אפליקציית Next.js 16 + TypeScript + Tailwind v4 מלאה, RTL בעברית, מ-Landing ועד Report/Admin.
- שכבת API עצמאית ב-PHP (`cpanel-api/`) עם סכימת MySQL מלאה, מוכנה להעלאה ל-cPanel.
- אבסטרקציה נקייה לשלושת ספקי ה-AI עם web search מופעל, מצב `MOCK_AI` לפיתוח, וקונפיגורציה
  מרכזית אחת לשמות מודלים/כמות שאילתות/concurrency.
- מנוע ניתוח (mentioned vs recommended, מיקום, מתחרים, מקורות) עם נרמול שמות/דומיינים.
- מנגנון עיבוד "batch" עמיד ל-timeout של Vercel, עם מסך התקדמות אמיתי (לא אחוז מזויף).

**מה שצריך להגדיר ידנית לפני production:** מפתחות ה-AI האמיתיים, מסד MySQL + `config.php`
ב-cPanel (כולל `api_secret` ייחודי), `ADMIN_SECRET`, ו-`DATABASE_API_URL`/`DATABASE_API_SECRET`
ב-Vercel.
