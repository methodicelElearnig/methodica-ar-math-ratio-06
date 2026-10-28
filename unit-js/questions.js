/* =====================================================================
   methodica-math-ratio-06 — question configs (יעד 1.6, יחס).

   Copy is VERBATIM from the deck; bold follows the source runs; option order
   is the RENDERED order (the scanner cannot resolve the group transforms and
   prints a different order on every SCQ slide — using it would re-key four
   questions, since `correct` is positional).

   THE UNIT'S HINT RULE (deck slide 8's note, governs every question):
     "הרמז בכל היחידה הזו מגיע אחרי טעות אחת"
   That is the engine's DEFAULT, so no question here carries `hintPolicy`.
   The one exception is the hook question (screen 1 / deck slide 4): one
   attempt, no hint at all.

   Screen ↔ deck slide: 4→s1 · 8→s4(Q1) 9→s5 10→s6 11→s7 12→s8 13→s9 14→s10
   15→s11 16→s12 17→s13 … see docs/forensics/ for the per-slide build cards.
   ===================================================================== */

'use strict';

/* The deck draws its feedback panels in light green / light pink with these
   exact titles; the body is identical on both panels on every slide, with the
   wrong panel adding "התשובה הנכונה מוצגת". */
const FB = (title, body, wrongTitle) => ({
  correct: { title, body },
  wrong:   { title: wrongTitle, body },
  retry:   'هذا غير دقيق، هل نحاول مجدداً؟',
});

/* an LTR isolate for a run of arithmetic inside RTL copy */
const eq  = (t) => `<span class="eq-ltr">${t}</span>`;
const eqc = (t) => `<p class="fb-eq">${eq(t)}</p>`;
/* a ratio always travels in its own LTR isolate (maven-skills §5) */
const ratio = (t) => `<span class="ratio">${t}</span>`;
/* a fraction is STACKED, never inline a/b (maven-skills §9) */
const frac = (top, bottom) =>
  `<span class="fraction"><span class="frac-top">${top}</span><span class="frac-bottom">${bottom}</span></span>`;

const QUESTIONS = [];

/* ══════════════════════════════════════════════════════════════════════
   Component 01 · the hook question  (deck slide 4 → screen 1)
   ══════════════════════════════════════════════════════════════════════ */

QUESTIONS.push(
  {
    /* deck slide 4. THE ONE EXCEPTION to the unit's hint rule: its note says
       "ניסיון מענה אחד" and "אין רמז" — one attempt, no hint button at all.
       Key = 16 (third option): green radio + "התשובה הנכונה היא ג" + 12÷3=4, 4×4=16.
       Both feedback equations are stored REVERSED in the deck (`4 = 3 : 12`,
       `16 = 4 · 4`); they are built here in the order the deck RENDERS. */
    screen: 1, type: 'single', label: '',
    stem: `الحفاظ بالفعل موضوعة في الصناديق، لكن عليك إضافة المنتجات
الجافة بحسب النسبة الصحيحة (${ratio('3:4')}).
<span class="q-ask"><br>
في أحد الصناديق يوجد بالفعل 12 علبة حفاظ.
كم منتج غذائي جاف عليك إضافة إلى الصندوق لكي تبقى النسبة بين
الحفاظ والمنتجات الجافة ${ratio('3:4')}؟</span>`,
    content: `<img class="q-photo" src="assets/img/hook-dry-goods.jpg" alt="مراهقون يعبئون منتجات جافة في صناديق غذائية">`,
    options: [
      { id: 'a', html: '4' },
      { id: 'b', html: '9' },
      { id: 'c', html: '16' },
      { id: 'd', html: '24' },
    ],
    correct: 'c',
    maxAttempts: 1, next: 2, prev: 0,
    /* no `hint` key at all — the engine renders no hint button without one */
    fb: FB('صحيح جداً', `
<p>الجزء الخاص بالمعلّبات في النسبة هو 3،<br>وهو يساوي فعليًا 12 علبة معلّبات.</p>
<p>لإيجاد قيمة "جزء" واحد في النسبة نقسم: ${eq('12: 3 = 4')}<br>كل جزء في النسبة يساوي – 4 أشياء.</p>
<p>المواد الغذائية الجافة يتم تمثيلها بـ 4 أجزاء، لذلك نضرب جزءًا واحدًا في 4.</p>
${eqc('4 · 4 = 16')}
<p>يجب إضافة 16 مادة غذائية جافة إلى الصندوق.<br>الإجابة الصحيحة هي 16.</p>`,
      'آه، ليس بالضبط. إليك الشرح:'),
  },
);

/* ══════════════════════════════════════════════════════════════════════
   Component 02 · questions 1-4  (deck slides 8-11 → screens 4-7)
   ══════════════════════════════════════════════════════════════════════ */

QUESTIONS.push(
  {
    /* deck slide 8 — Q1. Key = 16 (third option). The deck labels this slide
       MultipleChoiceQuestion and slide 11 SingleChoiceQuestionImage, but THIS
       one has the photo and a single key — the two labels look swapped
       (OPEN QUESTION). Built as single-choice with an image. */
    step: { group: 'practice', index: 1, total: 10 },
    screen: 4, type: 'single', label: '',
    stem: `في الحافلة يوجد 36 طفلاً وبالغاً.<br>
النسبة بين عدد الأطفال والبالغين في الحافلة هي ${ratio('4:5')}.
<span class="q-ask">كم عدد الأطفال في الحافلة؟</span>`,
    content: `<img class="q-photo" src="assets/img/q1-bus.jpg" alt="أطفال وبالغون يسافرون بالحافلة">`,
    options: [
      { id: 'a', html: '4' },
      { id: 'b', html: '8' },
      { id: 'c', html: '16' },
      { id: 'd', html: '20' },
    ],
    correct: 'c',
    maxAttempts: 2, next: 5, prev: 3,
    hint: `النسبة ${ratio('4:5')} تعني أن الركاب مقسمون إلى مجموعات متساوية.<br>كم عدد "الأجزاء" (أو "الحصص") في المجموع على الحافلة.<br>كم عدد منها يمثّل الأطفال؟`,
    fb: FB('إجابة صحيحة.', `
<p>مجموع أجزاء النسبة هو 9 (4 أجزاء من الأطفال + 5 أجزاء من البالغين).</p>
<p>أي أنه يمكننا تقسيم 36 الركاب إلى 9 مجموعات متساوية.</p>
<p>دعنا نتحقق من عدد الركاب في كل جزء:</p>
${eqc('36: 9 = 4')}
<p>بما أن عدد الأطفال يتم تمثيله بـ 4 أجزاء، سنضرب عدد الأجزاء في عدد الركاب في كل جزء:</p>
${eqc('4 · 4 = 16')}
<p>يوجد 16 طفلاً في الحافلة.</p>`,
      'أخطأت، رائع أنك حاولت، الآن يمكننا أن نكون أكثر دقة:'),
  },
  {
    /* deck slide 9 — Q2. The deck mocks the ANSWERED state (a green 45 sitting
       in the box); the initial state is empty. */
    step: { group: 'practice', index: 2, total: 10 },
    screen: 5, type: 'value-input', label: '',
    stem: `تتكون البطانية المربعة من مربعات صفراء ومربعات زرقاء بنسبة ${ratio('3:5')}.<br>
 (عدد المربعات الصفراء أقل).<br>
 تحتوي البطانية على 27 مربعًا أصفر في المجموع.<br>
 <span class="q-ask">كم عدد المربعات الزرقاء في البطانية؟</span>`,
    valueBox: { label: 'عدد المربعات الزرقاء' },
    correctInputs: ['45'],
    maxAttempts: 2, next: 6, prev: 4,
    hint: '3 "أجزاء" في النسبة تمثّل 27 مربعاً أصفر.<br>كم عدد المربعات في "جزء" واحد؟',
    fb: FB('صحيح!', `
<p>الجزء من المربعات الصفراء هو 3،<br>وهي تساوي 27 مربعًا فعليًا.</p>
<p>لكي نجد قيمة "جزء" واحد في النسبة، نقسم: ${eq('27: 3 = 9')}<br>كل جزء في النسبة يساوي 9 مربعات.</p>
<p>المربعات الزرقاء يتم تمثيلها بـ 5 أجزاء. لذلك، نضرب قيمة جزء واحد في 5:</p>
${eqc('5 · 9 = 45')}
<p><strong>في البطانية يوجد 45 مربعًا أزرق.</strong></p>`,
      'هذا خطأ، لكننا نتعلم من الأخطاء أيضًا.<br>الإجابة الصحيحة معروضة هنا.'),
  },
  {
    /* deck slide 10 — Q3. ⚠ The deck prints "כמה ליטרים של צבע כחול יואב צריך?"
       TWICE (once regular inside the statement, once bold as the question) —
       confirmed on the rendered page. Built ONCE, as the bold question line;
       flagged as the top item in docs/OPEN-QUESTIONS.md. */
    step: { group: 'practice', index: 3, total: 10 },
    screen: 6, type: 'value-input', label: '',
    stem: `يوسف يحتاج إلى 10 ليترات من الطلاء لتلوين غرفته.
اختار لونًا يتكون من خلط الأزرق والأخضر بنسبة ${ratio('3:2')}.
كم لترًا من الطلاء الأزرق يحتاج يوسف؟`,
    valueBox: { unit: 'ليترات', label: 'كمية الصبغة الزرقاء' },
    correctInputs: ['6'],
    maxAttempts: 2, next: 7, prev: 5,
    hint: 'ابحثوا عن عدد الأجزاء المتساوية التي تُقسّم إليها كمية الطلاء الكلية، وكم لتراً يساوي كل جزء من هذه الأجزاء.<br>تذكروا أن الأزرق مذكور أولاً ولذلك يطابق الرقم الأول في النسبة (3).',
    fb: FB('صحيح!', `
<p>سكّ كل الأجزاء في الخليط هو 5<br>(3 أجزاء من الأزرق + 2 جزء من الأخضر).</p>
<p>كمية الصبغة الكلية هي 10 لترات.</p>
<p>نجد كم لتراً يوجد في كل "جزء":</p>
${eqc('10: 5 = 2')}
<p>الصبغة الزرقاء تمثلها 3 أجزاء، لذلك نضرب: ${eq('2 · 3 = 6')}</p>
<p><strong>يوسف يحتاج إلى 6 لترات من الصبغة الزرقاء.</strong></p>`,
      'هذا خطأ. الإجابة الصحيحة معروضة أدناه.<br>من الجيد أن تستمر في التدرب.'),
  },
  {
    /* deck slide 11 — Q4. Key = 32 (fourth option), marked twice over: green
       radio AND a green pill outline. NO IMAGE on this slide although the deck
       names it …Image (OPEN QUESTION). */
    step: { group: 'practice', index: 4, total: 10 },
    screen: 7, type: 'single', label: '',
    stem: `تخليط معادن مصنوع من الذهب والفضة بنسبة ${ratio('1:4')}.
 <span class="q-ask">ما وزن الفضة، بالغرامات، في 40 غرام من هذا التخليط المعدني؟</span>`,
    options: [
      { id: 'a', html: '8' },
      { id: 'b', html: '10' },
      { id: 'c', html: '30' },
      { id: 'd', html: '32' },
    ],
    correct: 'd',
    maxAttempts: 2, next: 8, prev: 6,
    hint: 'كم غراماً يوجد في "حصة" واحدة من المزيج الذي يتضمن جزأي النسبة معاً (الذهب والفضة معاً)؟',
    fb: FB('صحيح!', `
<p>اليحس هو ${ratio('1:4')}. أي أن حصة أساسية واحدة من المخلوط تزن 5 غرامات.</p>
<p>لننظر كم حصة من هذه الحصص تدخل في 40 غرام:</p>
<p>${eq('40: 5 = 8')} أي 8 حصص.</p>
<p>في كل حصة كهذه يوجد 4 غرامات من الفضة،<br>لذلك الكمية الإجمالية من الفضة هي: 32 غرام.</p>
<p><strong>الإجابة الصحيحة هي 32 غرام.</strong></p>`,
      'أخطأت، لكن كل خطأ هو خطوة إلى الأمام في الطريق.'),
  },
);

/* ══════════════════════════════════════════════════════════════════════
   Component 02 · questions 5-10  (deck slides 12-17 → screens 8-13)
   ══════════════════════════════════════════════════════════════════════ */

/* deck slide 12 — Q5. Strip model: 5 saving cells = 150 ₪, 3 spending cells.
   The deck mixes שקלים and ש"ח inside one panel — built as written (§1a). */
const S8_BODY = `
<p>معطى أن 5 مربعات تساوي 150 شيكل. وبالتالي قيمة المربع الواحد هي 30 شيكل.</p>
<p>نموذج الأشرطة يظهر أن نفقات رنا تتكون من 3 مربعات.</p>
${eqc('30 · 3 = 90')}
<p><strong>كان مجموع نفقات رنا 90 شيكل.</strong></p>`;

/* the strip model itself — two right-aligned bars of equal cells, the label
   to the RIGHT of each bar exactly as the deck lays them out */
const BUDGET_STRIP = `
<div class="strip-model" role="img" aria-label="نموذج الأشرطة: ادخار خمس مربعات، نفقات ثلاث مربعات">
  <div class="strip-row"><span class="strip-label">الادخار</span>
    <span class="strip-bar">${'<i></i>'.repeat(5)}</span></div>
  <div class="strip-row"><span class="strip-label">النفقات</span>
    <span class="strip-bar">${'<i></i>'.repeat(3)}</span></div>
</div>`;

QUESTIONS.push(
  {
    step: { group: 'practice', index: 5, total: 10 },
    screen: 8, type: 'value-input', label: '',
    stem: `امامك نموذج أشرطة يمثل الميزانية الأسبوعية لرنا،<br> المقسمة بين الادخار والمصروفات.<br> كل مربع يمثل "حصة" متساوية من المال: ${BUDGET_STRIP} <span class="q-ask">إذا كان رنا قد ادخر هذا الأسبوع 150 شيقل<br>(المبلغ الممثل بـ 5 مربعات الادخار)،<br>فما كان مبلغ مصروفاتها؟</span>`,
    content: `<img class="q-photo" src="assets/img/q5-savings.jpg" alt="فتاة تحمل حصالة">`,
    valueBox: { unit: 'ش.ج', label: 'مبلغ النفقات' },
    correctInputs: ['90'],
    maxAttempts: 2, next: 9, prev: 7,
    hint: 'استخدموا بيانات المدخرات لاكتشاف قيمة كل مربع واحد في النموذج.',
    fb: FB('صحيح!', S8_BODY, 'أخطأت، وهذا يعني أن هناك تفكيراً هنا...<br>يتم عرض الإجابة الصحيحة.'),
  },
  {
    /* deck slide 13 — Q6. NO IMAGE on the slide (typed …Image, but the rels
       carry no photo and the note names none) — OPEN QUESTION.
       The feedback's `4 = 7 : 28` is stored reversed and RENDERS `28 : 7 = 4`;
       the rendered form is the correct one and is what we build. */
    step: { group: 'practice', index: 6, total: 10 },
    screen: 9, type: 'single', label: '',
    stem: `النسبة بين الضلع القصير والضلع الطويل للمستطيل هي ${ratio('2:5')}.<br>
 إذا كان محيط المستطيل (مجموع الأضلاع الأربعة) هو 56 سم،
 <span class="q-ask">ما هي أطوال أضلاع المستطيل؟</span>`,
    options: [
      { id: 'a', html: '8 و20' },
      { id: 'b', html: '40 و 16' },
      { id: 'c', html: '50 و-6' },
      { id: 'd', html: '32 و-24' },
    ],
    correct: 'a',
    maxAttempts: 2, next: 10, prev: 8,
    hint: 'تذكّروا أن محيط المستطيل يتكون من ضعفي الضلع القصير وضعفي الضلع الطويل. لذلك عليكم جمع جميع الأجزاء الأربعة من النسبة.',
    fb: FB('صحيح!', `
<p>مجموع ضلعين متجاورين في المستطيل هو 28 سم.</p>
<p>إذا كان النسبة بين أطوال الأضلاع هي 2 إلى 5، فإن إجمالي "الأجزاء" هو 7.</p>
<p>نقسم: ${eq('28: 7 = 4')}</p>
<p>ولذلك يجب أن نضرب النسب بعامل التوسع 4.</p>
<p>نحصل على أن طول الضلع الأقصر هو 8 سم وطول الضلع الأطول هو 20 سم.</p>
<p><strong>الإجابة الصحيحة هي 20 و-8.</strong></p>`,
      'أخطأت، لا تقلق، الفهم يُبنى بالتدريج.'),
  },
  {
    /* deck slide 14 — Q7. The hint below is the FULL text from the XML; the
       scanner truncates it at "…במתכון ה". */
    step: { group: 'practice', index: 7, total: 10 },
    screen: 10, type: 'single', label: '',
    stem: `لدى نادر وصفة كعكة تتطلب بيضتين و0.6 لتر حليب.<br>
 يريد أن يحضّر كعكة كبيرة قدر الإمكان، وليس لديه سوى 5 بيضات.
 <span class="q-ask">كم لتراً من الحليب يحتاج نادر لتحضير أكبر كعكة ممكنة؟</span>`,
    content: `<img class="q-photo" data-no-zoom src="assets/img/q7-nir.jpg" alt="فتى واقف بيده على رأسه">`,
    options: [
      { id: 'a', html: '1.2' },
      { id: 'b', html: '2.4' },
      { id: 'c', html: '1.5' },
      { id: 'd', html: '2' },
    ],
    correct: 'c',
    maxAttempts: 2, next: 11, prev: 9,
    hint: 'احسبوا كم حليباً مطلوباً لتحضير كعكة ببيضة واحدة فقط، أو اوجدوا بكم مرة تكون كمية البيض الجديدة أكبر من الكمية في الوصفة الأصلية.',
    fb: FB('صحيح!', `
<p>في الوصفة الأصلية، النسبة هي بيضتان لـ 0.6 لتر من الحليب. لدى نادر 5 بيضات، أي 2.5 مرة من الكمية الأصلية.</p>
<p>سنضرب العدد 0.6 لتر من الحليب في 2.5 فنحصل على 1.5 لتر من الحليب.</p>
<p><strong>الإجابة الصحيحة هي 1.5 لتر.</strong></p>`,
      'أخطأت، لا بأس، إليك الشرح:'),
  },
  {
    /* deck slide 15 — Q8. NO IMAGE (typed …Image) — OPEN QUESTION.
       BOTH feedback equations are stored in the order that renders BACKWARDS
       (`72× 60 .` → `60 ×72`, `70×60=4,200` → `4,200=60×70`); built in the
       intended reading order inside LTR isolates. `בערך` is bold AND underlined. */
    step: { group: 'practice', index: 8, total: 10 },
    screen: 11, type: 'single', label: '',
    stem: `معدّل نبضات قلب الشخص هو 72 نبضة في الدقيقة.
 <span class="q-ask">بهذا المعدّل، قدّروا كم نبضة قلب <u>تقريباً</u> سيكون لدى الشخص في الساعة؟</span>`,
    options: [
      { id: 'a', html: '420,000' },
      { id: 'b', html: '42,000' },
      { id: 'c', html: '4,200' },
      { id: 'd', html: '420' },
    ],
    correct: 'c',
    maxAttempts: 2, next: 12, prev: 10,
    hint: 'كم عدد الدقائق في الساعة الواحدة؟ اضربوا العدد في معدل نبضات القلب في الدقيقة.',
    fb: FB('صحيح!', `
<p>في الساعة الواحدة 60 دقيقة. إذا كان القلب ينبض 72 مرة في الدقيقة الواحدة، يجب أن نضرب:</p>
${eqc('72 × 60')}
<p>سنستخدم التقدير لتقريب الإجابة ("تقريباً") - نقرّب 72 إلى 70: ${eq('70 × 60 = 4,200')}</p>
<p>الحساب الدقيق هو 4,320، والتقدير الأقرب هو 4,200.</p>
<p><strong>الإجابة الصحيحة هي 4,200.</strong></p>`,
      'أخطأت، لكن هكذا يتطور التفكير الرياضي.'),
  },
  {
    /* deck slide 16 — Q9. The note says accept 2/11 as well as 2:11. */
    step: { group: 'practice', index: 9, total: 10 },
    screen: 12, type: 'value-input', label: '',
    stem: `في تحضير السماد للحديقة، يخلط البستاني 2 كغ نتروجين (نترات)، 3 كغ فوسفات<br>و6 كغ بوتاسيوم (بوتاسيوم).
 <span class="q-ask">ما هي النسبة بين كمية النتروجين والكمية الكلية للسماد؟</span>`,
    content: `<img class="q-photo q-photo--wide" src="assets/img/q9-gardener.jpg" alt="بستاني يعتني بشجيرة الكوبية">`,
    /* 24.09, producer: the ratio is typed as TWO boxes with the colon between
       them, not one field holding "2:11". That also retires the inputChars
       escape hatch the single field needed to keep its colon — and the deck's
       "accept 2/11 too" note, which a two-box row cannot express. */
    ratioRows: [{ label: 'النسبة', parts: 2 }],
    correctInputs: ['2', '11'],
    maxAttempts: 2, next: 13, prev: 11,
    hint: 'قبل كتابة النسبة، عليكم حساب "الكمية الإجمالية" لخليط السماد.',
    fb: FB('صحيح!', `
<p>نجد الكمية الإجمالية للسماد بإضافة جميع المكونات: 11 كغ إجمالاً.</p>
<p>كمية النيتروجين هي 2 كغ.</p>
<p>لذلك، النسبة بين كمية النيتروجين والكمية الإجمالية هي 2 إلى 11.</p>
<p>(يمكن كتابة ذلك كـ ${ratio('2:11')} أو ككسر ${frac('2', '11')}).</p>`,
      'آسف، الإجابة الصحيحة معروضة أدناه.<br>دعنا نشرح:'),
  },
  {
    /* deck slide 17 — Q10, the last question. NO IMAGE (typed …Image) —
       OPEN QUESTION. Its feedback is the longest in the unit (12 paragraphs),
       so the popup gets the inner-scroll treatment. */
    step: { group: 'practice', index: 10, total: 10 },
    screen: 13, type: 'single', label: '',
    stem: `في الجرة توجد كرات حمراء وخضراء بنسبة ${ratio('5:7')}.<br>
علماً بأن هناك 35 كرة خضراء في الجرة.
<span class="q-ask">إذا أضفنا إلى الجرة 10 كرات حمراء،<br>ما ستكون النسبة الجديدة بين الكرات الحمراء والخضراء؟</span>`,
    options: [
      { id: 'a', html: ratio('15:7') },
      { id: 'b', html: ratio('15:35') },
      { id: 'c', html: ratio('1:1') },
      { id: 'd', html: ratio('5:17') },
    ],
    correct: 'c',
    maxAttempts: 2, next: 14, prev: 12,
    hint: 'اعملوا بالتدريج: أولاً، جدوا كم كرة حمراء كانت في الإناء قبل الإضافة.',
    fb: FB('صحيح!', `
<p>النسبة الأصلية هي ${ratio('5:7')} (5 للكرات الحمراء، 7 للكرات الخضراء).</p>
<p>7 أجزاء خضراء تساوي 35 كرة، لذلك كل "جزء" يساوي 5.</p>
<p>نحسب عدد الكرات الحمراء في البداية:</p>
<p>5 أجزاء مضروب ${eq('5 = 25')} <span class="eq-unit" dir="rtl">كرات حمراء</span>.</p>
<p>الآن نضيف 10 كرات حمراء، أي ستصبح 35 كرة حمراء.</p>
<p>عدد الكرات الخضراء بقي 35.</p>
<p>النسبة الجديدة هي 35 حمراء إلى 35 خضراء (${ratio('35:35')}).</p>
<p>عندما تكون الكميتان متساويتين، تختصر النسبة إلى ${ratio('1:1')}.</p>
<p><strong>الإجابة الصحيحة هي ${ratio('1:1')}.</strong></p>`,
      'أخطأت، هل تحتاج فقط إلى بعض الدقة؟'),
  },
);
