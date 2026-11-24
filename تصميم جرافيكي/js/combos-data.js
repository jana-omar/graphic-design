/* ==========================================================================
   نملية — Namliyah | combos-data.js
   --------------------------------------------------------------------------
   بيانات بكجات نملية (معتمدة من صاحب المشروع).
   الأسعار مُدخلة من القائمة التي زوّدتَ بها. لا توجد أسعار قبل/بعد خصم.

   الصور المخصصة:
     Package of offers1.PNG → بكج المنسف الأردني
     Package of offers2.PNG → بكج المشاوي
   ========================================================================== */

const COMBOS = [
  {
    id: 'combo-mansaf',
    nameAr: 'بكج المنسف الأردني',
    nameEn: 'Jordanian Mansaf Combo',
    image: 'images/Package of offers1.PNG',
    descAr: 'منسف أردني مع سلطة تبولة، ومشروب غازي باختيارك.',
    components: [
      { nameAr: 'منسف أردني', nameEn: 'Jordanian Mansaf' },
      { nameAr: 'سلطة تبولة', nameEn: 'Tabouleh Salad' }
    ],
    drinks: [
      { nameAr: 'بيبسي', nameEn: 'Pepsi' },
      { nameAr: 'سبرايت', nameEn: 'Sprite' }
    ],
    price: 75
  },
  {
    id: 'combo-grills',
    nameAr: 'بكج المشاوي',
    nameEn: 'Mixed Grills Combo',
    image: 'images/Package of offers2.PNG',
    descAr: 'صحن مشاوي مع بطاطس وورق عنب، ومشروب غازي باختيارك.',
    components: [
      { nameAr: 'صحن مشاوي', nameEn: 'Mixed Grills Plate' },
      { nameAr: 'بطاطس', nameEn: 'French Fries' },
      { nameAr: 'ورق عنب', nameEn: 'Grape Leaves' }
    ],
    drinks: [
      { nameAr: 'بيبسي', nameEn: 'Pepsi' },
      { nameAr: 'سبرايت', nameEn: 'Sprite' }
    ],
    price: 95
  }
];
