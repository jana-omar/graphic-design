/* ==========================================================================
   نملية — Namliyah | menu-data.js
   --------------------------------------------------------------------------
   هذا هو الملف الوحيد المسؤول عن بيانات القائمة (الأطباق والأسعار).
   الأسماء مأخوذة من أسماء ملفات الصور التي زوّدتَ بها المشروع، مرتبة حسب
   الرقم في اسم الملف (1 إلى 9). الأسعار مُدخلة من القائمة التي زوّدتَ بها.

   طريقة تعديل صنف:
     - price: 25            → يظهر 25.00 ر.س
     - price: null          → يظهر «قيد الإضافة» (لا يُحسب في الإجمالي)
     - featured: true       → يظهر في «أطباق مميزة» بالصفحة الرئيسية

   طريقة إضافة صنف جديد:
     {
       id: 'unique-id',             // معرّف فريد بالإنجليزية (إجباري)
       category: 'appetizers',      // يطابق أحد معرّفات CATEGORIES (إجباري)
       nameAr: 'اسم الطبق بالعربية', // إجباري
       nameEn: 'English Name',      // إجباري
       price: 25,                   // السعر بالريال أو null (إجباري)
       image: 'images/....PNG',     // مسار الصورة (إجباري)
       descAr: 'وصف قصير',          // اختياري
       featured: true               // اختياري
     }

   ⚠️ لا تكرّر صورة واحدة لأكثر من صنف.
   ========================================================================== */

/* فئات القائمة التنظيمية */
const CATEGORIES = [
  { id: 'appetizers', nameAr: 'المقبلات',        nameEn: 'Appetizers' },
  { id: 'mains',      nameAr: 'الأطباق الرئيسية', nameEn: 'Main Dishes' },
  { id: 'desserts',   nameAr: 'الحلويات',         nameEn: 'Desserts' },
  { id: 'drinks',     nameAr: 'المشروبات',        nameEn: 'Drinks' }
];

/* الأطباق — بالترتيب المرقم في أسماء ملفات الصور */
const MENU_ITEMS = [
  {
    id: 'dish-1',
    category: 'appetizers',
    nameAr: 'تبولة',
    nameEn: 'Tabouleh Salad',
    price: 22,
    image: 'images/Tabuleh salad 1.PNG',
    featured: true
  },
  {
    id: 'dish-2',
    category: 'appetizers',
    nameAr: 'ورق عنب',
    nameEn: 'Grape Leaves',
    price: 24,
    image: 'images/grape leaves 2.PNG'
  },
  {
    id: 'dish-3',
    category: 'appetizers',
    nameAr: 'كبة بالحليب',
    nameEn: 'Kubba with Milk',
    price: 32,
    image: 'images/Kubba with milk appetizers3.PNG'
  },
  {
    id: 'dish-4',
    category: 'mains',
    nameAr: 'منسف أردني بالأرز',
    nameEn: 'Jordanian Mansaf Rice',
    price: 69,
    image: 'images/Jordanian Mansaf Rice 4.PNG',
    featured: true
  },
  {
    id: 'dish-5',
    category: 'mains',
    nameAr: 'مشاوي مشكلة',
    nameEn: 'Mixed Grills',
    price: 79,
    image: 'images/Grills5.PNG',
    featured: true
  },
  {
    id: 'dish-6',
    category: 'desserts',
    nameAr: 'كنافة بالقشدة والفستق',
    nameEn: 'Kunafa with Cream & Pistachio',
    price: 32,
    image: 'images/Kunafa with cream and pistachio dessert6.PNG',
    featured: true
  },
  {
    id: 'dish-7',
    category: 'desserts',
    nameAr: 'آيس كريم',
    nameEn: 'Ice Cream',
    price: 20,
    image: 'images/Ice cream dessert7.PNG'
  },
  {
    id: 'dish-8',
    category: 'drinks',
    nameAr: 'شاي أحمر',
    nameEn: 'Red Tea',
    price: 4,
    image: 'images/8 Red tea drink.PNG'
  },
  {
    id: 'dish-9',
    category: 'drinks',
    nameAr: 'شاي أخضر',
    nameEn: 'Green Tea',
    price: 4,
    image: 'images/Green tea drink 9.PNG'
  }
];
