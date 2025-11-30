// Hardcoded Exercise Library
// 18 exercises total - 3 per face region

export type RegionId = 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' | 'face_shape';

export interface Exercise {
  id: string;
  regionId: RegionId;
  title: string;
  titleTr: string; // Turkish title
  description: string;
  descriptionTr: string; // Turkish description
  purpose: string; // Why this exercise is important
  purposeTr: string; // Turkish purpose
  duration: string; // e.g., "30 saniye", "1 dakika"
  repetitions: string; // e.g., "10 tekrar", "3 set"
  steps: string[];
  stepsTr: string[]; // Turkish steps
  benefits: string[];
  benefitsTr: string[]; // Turkish benefits
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
}

export const EXERCISES: Exercise[] = [
  // ============ EYEBROWS (Kaşlar) ============
  {
    id: 'eyebrow_lift',
    regionId: 'eyebrows',
    title: 'Eyebrow Lift',
    titleTr: 'Kaş Kaldırma',
    description: 'Strengthens forehead muscles and lifts eyebrows naturally.',
    descriptionTr: 'Alın kaslarını güçlendirir ve kaşları doğal olarak kaldırır.',
    purpose: 'Eyebrows frame your face and affect your overall expression. This exercise combats aging by strengthening the frontalis muscle, preventing drooping.',
    purposeTr: 'Kaşlar yüzünüzü çerçeveler ve genel ifadenizi etkiler. Bu egzersiz frontalis kasını güçlendirerek yaşlanmaya ve sarkmalara karşı savaşır.',
    duration: '30 saniye',
    repetitions: '10 tekrar',
    steps: [
      'Place fingers above eyebrows',
      'Push eyebrows down with fingers',
      'Try to raise eyebrows against resistance',
      'Hold for 3 seconds, then release',
    ],
    stepsTr: [
      'Parmaklarınızı kaşlarınızın üstüne yerleştirin',
      'Parmaklarınızla kaşlarınızı aşağı itin',
      'Dirence karşı kaşlarınızı kaldırmaya çalışın',
      '3 saniye tutun, sonra bırakın',
    ],
    benefits: ['Lifts droopy eyebrows', 'Reduces forehead wrinkles', 'Improves eyebrow arch'],
    benefitsTr: ['Düşük kaşları kaldırır', 'Alın kırışıklıklarını azaltır', 'Kaş kemerini iyileştirir'],
    difficulty: 'easy',
    icon: '🏋️',
  },
  {
    id: 'eyebrow_squeeze',
    regionId: 'eyebrows',
    title: 'Eyebrow Squeeze',
    titleTr: 'Kaş Sıkıştırma',
    description: 'Targets the muscles between eyebrows to reduce frown lines.',
    descriptionTr: 'Kaşlar arasındaki kasları hedefler ve kırışıklıkları azaltır.',
    purpose: 'The area between your eyebrows shows stress and aging. This exercise smooths frown lines by strengthening the corrugator muscles.',
    purposeTr: 'Kaşlarınız arasındaki bölge stresi ve yaşlanmayı gösterir. Bu egzersiz corrugator kaslarını güçlendirerek çatık çizgileri düzleştirir.',
    duration: '20 saniye',
    repetitions: '15 tekrar',
    steps: [
      'Bring eyebrows together as if frowning',
      'Hold the squeeze for 2 seconds',
      'Release and raise eyebrows high',
      'Repeat the cycle',
    ],
    stepsTr: [
      'Kaşlarınızı kaşlarınızı çatarmış gibi birleştirin',
      'Sıkışmayı 2 saniye tutun',
      'Bırakın ve kaşlarınızı yukarı kaldırın',
      'Döngüyü tekrarlayın',
    ],
    benefits: ['Smooths frown lines', 'Improves muscle control', 'Balances eyebrow position'],
    benefitsTr: ['Kaş çatma çizgilerini düzleştirir', 'Kas kontrolünü artırır', 'Kaş pozisyonunu dengeler'],
    difficulty: 'easy',
    icon: '😤',
  },
  {
    id: 'eyebrow_asymmetry_fix',
    regionId: 'eyebrows',
    title: 'Asymmetry Correction',
    titleTr: 'Asimetri Düzeltme',
    description: 'Focuses on the weaker eyebrow to improve symmetry.',
    descriptionTr: 'Simetriyi iyileştirmek için zayıf kaşa odaklanır.',
    purpose: 'Facial symmetry directly impacts attractiveness scores. This targeted exercise corrects eyebrow imbalances detected in your analysis.',
    purposeTr: 'Yüz simetrisi çekicilik puanınızı doğrudan etkiler. Bu hedefli egzersiz analizinizde tespit edilen kaş dengesizliklerini düzeltir.',
    duration: '45 saniye',
    repetitions: '8 tekrar (her taraf)',
    steps: [
      'Identify the lower/weaker eyebrow',
      'Place finger on the stronger eyebrow to hold it',
      'Raise only the weaker eyebrow',
      'Hold for 5 seconds',
    ],
    stepsTr: [
      'Daha düşük/zayıf kaşı belirleyin',
      'Güçlü kaşı tutmak için parmağınızı koyun',
      'Sadece zayıf kaşı kaldırın',
      '5 saniye tutun',
    ],
    benefits: ['Improves eyebrow symmetry', 'Strengthens weak muscles', 'Better facial balance'],
    benefitsTr: ['Kaş simetrisini iyileştirir', 'Zayıf kasları güçlendirir', 'Daha iyi yüz dengesi'],
    difficulty: 'medium',
    icon: '⚖️',
  },

  // ============ EYES (Gözler) ============
  {
    id: 'eye_squeeze',
    regionId: 'eyes',
    title: 'Eye Squeeze',
    titleTr: 'Göz Sıkıştırma',
    description: 'Strengthens the orbicularis oculi muscle around the eyes.',
    descriptionTr: 'Gözlerin etrafındaki orbicularis oculi kasını güçlendirir.',
    purpose: 'Eyes show age first through crow\'s feet and puffiness. This exercise tones the delicate muscles around your eyes to maintain youthful appearance.',
    purposeTr: 'Gözler kaz ayakları ve şişliklerle yaşı ilk gösteren bölgedir. Bu egzersiz gözlerinizin etrafındaki narin kasları tonlayarak genç görünümü korur.',
    duration: '30 saniye',
    repetitions: '12 tekrar',
    steps: [
      'Close your eyes tightly',
      'Squeeze for 3 seconds',
      'Open eyes wide',
      'Hold for 2 seconds',
    ],
    stepsTr: [
      'Gözlerinizi sıkıca kapatın',
      '3 saniye sıkın',
      'Gözlerinizi açın',
      '2 saniye tutun',
    ],
    benefits: ['Reduces crow\'s feet', 'Improves eye muscle tone', 'Reduces puffiness'],
    benefitsTr: ['Kaz ayaklarını azaltır', 'Göz kas tonusunu iyileştirir', 'Şişliği azaltır'],
    difficulty: 'easy',
    icon: '👁️',
  },
  {
    id: 'eye_circle',
    regionId: 'eyes',
    title: 'Eye Circles',
    titleTr: 'Göz Dairesi',
    description: 'Improves blood circulation and reduces dark circles.',
    descriptionTr: 'Kan dolaşımını iyileştirir ve koyu halkaları azaltır.',
    purpose: 'Poor circulation causes dark circles and tired appearance. This exercise boosts blood flow to give your eyes a refreshed, energized look.',
    purposeTr: 'Zayıf dolaşım koyu halkalar ve yorgun görünüme neden olur. Bu egzersiz kan akışını artırarak gözlerinize dinlenmiş, enerjik bir görünüm verir.',
    duration: '1 dakika',
    repetitions: '5 tur (her yön)',
    steps: [
      'Look straight ahead',
      'Slowly roll eyes clockwise',
      'Complete a full circle',
      'Repeat counter-clockwise',
    ],
    stepsTr: [
      'Düz ileriye bakın',
      'Yavaşça gözlerinizi saat yönünde çevirin',
      'Tam bir daire tamamlayın',
      'Saat yönünün tersine tekrarlayın',
    ],
    benefits: ['Improves circulation', 'Reduces eye strain', 'Strengthens eye muscles'],
    benefitsTr: ['Dolaşımı iyileştirir', 'Göz yorgunluğunu azaltır', 'Göz kaslarını güçlendirir'],
    difficulty: 'easy',
    icon: '🔄',
  },
  {
    id: 'eye_focus',
    regionId: 'eyes',
    title: 'Focus Shift',
    titleTr: 'Odak Değiştirme',
    description: 'Strengthens eye muscles and improves focus.',
    descriptionTr: 'Göz kaslarını güçlendirir ve odaklanmayı iyileştirir.',
    purpose: 'Screen time weakens eye muscles causing strain and fatigue. This exercise restores muscle flexibility for brighter, more alert eyes.',
    purposeTr: 'Ekran kullanımı göz kaslarını zayıflatarak gerginlik ve yorgunluğa neden olur. Bu egzersiz kas esnekliğini geri kazandırarak daha parlak, uyanık gözler sağlar.',
    duration: '45 saniye',
    repetitions: '10 tekrar',
    steps: [
      'Hold finger 10 inches from face',
      'Focus on finger for 3 seconds',
      'Shift focus to distant object',
      'Hold for 3 seconds, then repeat',
    ],
    stepsTr: [
      'Parmağınızı yüzünüzden 25 cm uzakta tutun',
      'Parmağa 3 saniye odaklanın',
      'Odağı uzak bir nesneye kaydırın',
      '3 saniye tutun, sonra tekrarlayın',
    ],
    benefits: ['Improves focus flexibility', 'Reduces eye fatigue', 'Strengthens ciliary muscles'],
    benefitsTr: ['Odak esnekliğini artırır', 'Göz yorgunluğunu azaltır', 'Silyer kasları güçlendirir'],
    difficulty: 'medium',
    icon: '🎯',
  },

  // ============ NOSE (Burun) ============
  {
    id: 'nose_shaping',
    regionId: 'nose',
    title: 'Nose Shaping',
    titleTr: 'Burun Şekillendirme',
    description: 'Helps define the nose bridge and reduce width.',
    descriptionTr: 'Burun köprüsünü tanımlamaya ve genişliği azaltmaya yardımcı olur.',
    purpose: 'Your nose is central to facial harmony. This exercise strengthens nasal muscles to refine shape and improve proportions naturally without surgery.',
    purposeTr: 'Burun yüz uyumunun merkezidir. Bu egzersiz burun kaslarını güçlendirerek ameliyatsız doğal yollarla şekli inceltir ve oranları iyileştirir.',
    duration: '30 saniye',
    repetitions: '15 tekrar',
    steps: [
      'Place index fingers on sides of nose',
      'Flare nostrils while pressing gently',
      'Hold for 2 seconds',
      'Release and repeat',
    ],
    stepsTr: [
      'İşaret parmaklarınızı burun kenarlarına koyun',
      'Hafifçe basarken burun deliklerini açın',
      '2 saniye tutun',
      'Bırakın ve tekrarlayın',
    ],
    benefits: ['Defines nose shape', 'Strengthens nasal muscles', 'May reduce width appearance'],
    benefitsTr: ['Burun şeklini tanımlar', 'Burun kaslarını güçlendirir', 'Genişlik görünümünü azaltabilir'],
    difficulty: 'easy',
    icon: '👃',
  },
  {
    id: 'nose_breathing',
    regionId: 'nose',
    title: 'Nasal Breathing',
    titleTr: 'Burun Nefesi',
    description: 'Improves nasal airflow and strengthens nose muscles.',
    descriptionTr: 'Burun hava akışını iyileştirir ve burun kaslarını güçlendirir.',
    purpose: 'Proper breathing affects facial structure. This ancient yogic technique improves oxygen flow and strengthens internal nasal passages.',
    purposeTr: 'Doğru nefes alma yüz yapısını etkiler. Bu eski yoga tekniği oksijen akışını iyileştirir ve iç burun geçitlerini güçlendirir.',
    duration: '1 dakika',
    repetitions: '5 döngü',
    steps: [
      'Close right nostril with thumb',
      'Inhale deeply through left nostril',
      'Close left nostril, open right',
      'Exhale through right nostril',
    ],
    stepsTr: [
      'Sağ burun deliğini başparmakla kapatın',
      'Sol burun deliğinden derin nefes alın',
      'Sol deliği kapatın, sağı açın',
      'Sağ burun deliğinden nefes verin',
    ],
    benefits: ['Improves breathing', 'Balances nasal function', 'Reduces congestion'],
    benefitsTr: ['Nefes almayı iyileştirir', 'Burun fonksiyonunu dengeler', 'Tıkanıklığı azaltır'],
    difficulty: 'easy',
    icon: '🌬️',
  },
  {
    id: 'nose_tip_lift',
    regionId: 'nose',
    title: 'Nose Tip Lift',
    titleTr: 'Burun Ucu Kaldırma',
    description: 'Targets muscles to lift a drooping nose tip.',
    descriptionTr: 'Düşen burun ucunu kaldırmak için kasları hedefler.',
    purpose: 'A drooping nose tip ages your profile. This exercise targets the depressor septi muscle to lift and refine your nose tip for a youthful angle.',
    purposeTr: 'Düşen burun ucu profilinizi yaşlandırır. Bu egzersiz depressor septi kasını hedefleyerek burun ucunuzu kaldırır ve genç bir açı sağlar.',
    duration: '30 saniye',
    repetitions: '20 tekrar',
    steps: [
      'Press index finger under nose tip',
      'Push nose down with upper lip',
      'Feel resistance against finger',
      'Hold for 2 seconds',
    ],
    stepsTr: [
      'İşaret parmağını burun ucunun altına bastırın',
      'Üst dudakla burnu aşağı itin',
      'Parmağa karşı direnci hissedin',
      '2 saniye tutun',
    ],
    benefits: ['Lifts drooping tip', 'Strengthens depressor septi', 'Improves nose profile'],
    benefitsTr: ['Düşen ucu kaldırır', 'Septum kasını güçlendirir', 'Burun profilini iyileştirir'],
    difficulty: 'medium',
    icon: '⬆️',
  },

  // ============ LIPS (Dudaklar) ============
  {
    id: 'lip_pout',
    regionId: 'lips',
    title: 'Lip Pout',
    titleTr: 'Dudak Büzme',
    description: 'Strengthens lip muscles and adds definition.',
    descriptionTr: 'Dudak kaslarını güçlendirir ve tanım ekler.',
    purpose: 'Full, well-defined lips are a youth marker. This exercise plumps lips naturally by strengthening the orbicularis oris muscle without fillers.',
    purposeTr: 'Dolgun, belirgin dudaklar gençlik işaretidir. Bu egzersiz dolgu olmadan orbicularis oris kasını güçlendirerek dudakları doğal şişirir.',
    duration: '30 saniye',
    repetitions: '15 tekrar',
    steps: [
      'Pout lips forward as much as possible',
      'Hold for 3 seconds',
      'Relax and smile wide',
      'Hold smile for 3 seconds',
    ],
    stepsTr: [
      'Dudakları mümkün olduğunca öne doğru büzün',
      '3 saniye tutun',
      'Gevşeyin ve geniş gülümseyin',
      'Gülümsemeyi 3 saniye tutun',
    ],
    benefits: ['Fuller looking lips', 'Reduces lip lines', 'Improves lip muscle tone'],
    benefitsTr: ['Daha dolgun görünen dudaklar', 'Dudak çizgilerini azaltır', 'Dudak kas tonusunu iyileştirir'],
    difficulty: 'easy',
    icon: '💋',
  },
  {
    id: 'lip_press',
    regionId: 'lips',
    title: 'Lip Press',
    titleTr: 'Dudak Bastırma',
    description: 'Targets upper lip to reduce lines and improve shape.',
    descriptionTr: 'Çizgileri azaltmak ve şekli iyileştirmek için üst dudağı hedefler.',
    purpose: 'Smoker\'s lines appear even without smoking from repeated lip movements. This exercise smooths vertical lines and enhances lip border definition.',
    purposeTr: 'Sigara içmeseniz bile tekrarlı dudak hareketlerinden dikey çizgiler oluşur. Bu egzersiz çizgileri düzleştirir ve dudak konturunu belirginleştirir.',
    duration: '20 saniye',
    repetitions: '12 tekrar',
    steps: [
      'Press lips tightly together',
      'Without opening, push lips forward',
      'Hold tension for 3 seconds',
      'Release and repeat',
    ],
    stepsTr: [
      'Dudakları sıkıca birbirine bastırın',
      'Açmadan dudakları öne itin',
      'Gerginliği 3 saniye tutun',
      'Bırakın ve tekrarlayın',
    ],
    benefits: ['Smooths upper lip lines', 'Improves lip symmetry', 'Strengthens orbicularis oris'],
    benefitsTr: ['Üst dudak çizgilerini düzleştirir', 'Dudak simetrisini iyileştirir', 'Orbicularis oris\'i güçlendirir'],
    difficulty: 'easy',
    icon: '😗',
  },
  {
    id: 'lip_corner_lift',
    regionId: 'lips',
    title: 'Corner Lift',
    titleTr: 'Köşe Kaldırma',
    description: 'Lifts drooping mouth corners for a happier expression.',
    descriptionTr: 'Daha mutlu bir ifade için düşen ağız köşelerini kaldırır.',
    purpose: 'Drooping mouth corners create a sad or angry resting face. This exercise lifts corners to restore a naturally pleasant, approachable expression.',
    purposeTr: 'Düşen ağız köşeleri üzgün veya öfkeli bir dinlenme yüzü yaratır. Bu egzersiz köşeleri kaldırarak doğal, yaklaşılabilir bir ifade restore eder.',
    duration: '30 saniye',
    repetitions: '10 tekrar',
    steps: [
      'Place fingers at mouth corners',
      'Smile while resisting with fingers',
      'Hold for 5 seconds',
      'Slowly release',
    ],
    stepsTr: [
      'Parmakları ağız köşelerine koyun',
      'Parmaklarla direnirken gülümseyin',
      '5 saniye tutun',
      'Yavaşça bırakın',
    ],
    benefits: ['Lifts mouth corners', 'Reduces marionette lines', 'Creates youthful expression'],
    benefitsTr: ['Ağız köşelerini kaldırır', 'Kukla çizgilerini azaltır', 'Genç ifade oluşturur'],
    difficulty: 'medium',
    icon: '😊',
  },

  // ============ JAWLINE (Çene Hattı) ============
  {
    id: 'jaw_clench',
    regionId: 'jawline',
    title: 'Jaw Clench',
    titleTr: 'Çene Sıkma',
    description: 'Strengthens masseter muscles for a defined jawline.',
    descriptionTr: 'Tanımlı bir çene hattı için masseter kaslarını güçlendirir.',
    purpose: 'A strong jawline is the #1 attractiveness marker. This exercise sculpts and defines your jaw by targeting the powerful masseter muscles.',
    purposeTr: 'Güçlü çene hattı 1 numaralı çekicilik işaretidir. Bu egzersiz güçlü masseter kaslarını hedefleyerek çenenizi şekillendirir ve tanımlar.',
    duration: '30 saniye',
    repetitions: '10 tekrar',
    steps: [
      'Clench teeth firmly together',
      'Feel the masseter muscles tighten',
      'Hold for 3 seconds',
      'Release and relax',
    ],
    stepsTr: [
      'Dişleri sıkıca birbirine sıkın',
      'Masseter kaslarının sıkılaştığını hissedin',
      '3 saniye tutun',
      'Bırakın ve gevşeyin',
    ],
    benefits: ['Defines jawline', 'Strengthens jaw muscles', 'Reduces double chin'],
    benefitsTr: ['Çene hattını tanımlar', 'Çene kaslarını güçlendirir', 'Çift çeneyi azaltır'],
    difficulty: 'easy',
    icon: '💪',
  },
  {
    id: 'chin_lift',
    regionId: 'jawline',
    title: 'Chin Lift',
    titleTr: 'Çene Kaldırma',
    description: 'Tightens neck and chin area.',
    descriptionTr: 'Boyun ve çene bölgesini sıkılaştırır.',
    purpose: 'Neck and chin sagging ruins jawline definition. This exercise targets the platysma muscle to tighten and lift the entire lower face area.',
    purposeTr: 'Boyun ve çene sarkmaSı çene hattı tanımını bozar. Bu egzersiz platysma kasını hedefleyerek tüm alt yüz bölgesini sıkılaştırır ve kaldırır.',
    duration: '45 saniye',
    repetitions: '8 tekrar',
    steps: [
      'Tilt head back looking at ceiling',
      'Push lower jaw forward',
      'Feel stretch in neck and chin',
      'Hold for 5 seconds',
    ],
    stepsTr: [
      'Başı tavana bakarak arkaya yatırın',
      'Alt çeneyi öne itin',
      'Boyun ve çenede gerilmeyi hissedin',
      '5 saniye tutun',
    ],
    benefits: ['Tightens chin area', 'Reduces neck sagging', 'Defines jaw angle'],
    benefitsTr: ['Çene bölgesini sıkılaştırır', 'Boyun sarkmasını azaltır', 'Çene açısını tanımlar'],
    difficulty: 'medium',
    icon: '🦢',
  },
  {
    id: 'jaw_slide',
    regionId: 'jawline',
    title: 'Jaw Slide',
    titleTr: 'Çene Kaydırma',
    description: 'Improves jaw mobility and facial symmetry.',
    descriptionTr: 'Çene hareketliliğini ve yüz simetrisini iyileştirir.',
    purpose: 'Jaw asymmetry reduces attractiveness scores. This exercise balances left and right jaw muscles to improve overall facial symmetry and harmony.',
    purposeTr: 'Çene asimetrisi çekicilik puanını düşürür. Bu egzersiz sol ve sağ çene kaslarını dengeleyerek genel yüz simetrisini ve uyumunu iyileştirir.',
    duration: '30 saniye',
    repetitions: '10 tekrar (her yön)',
    steps: [
      'Keep teeth slightly apart',
      'Slide jaw slowly to the right',
      'Hold for 2 seconds',
      'Return to center, then slide left',
    ],
    stepsTr: [
      'Dişleri hafifçe ayrık tutun',
      'Çeneyi yavaşça sağa kaydırın',
      '2 saniye tutun',
      'Merkeze dönün, sonra sola kaydırın',
    ],
    benefits: ['Improves jaw symmetry', 'Reduces TMJ tension', 'Enhances jaw definition'],
    benefitsTr: ['Çene simetrisini iyileştirir', 'TMJ gerginliğini azaltır', 'Çene tanımını artırır'],
    difficulty: 'easy',
    icon: '↔️',
  },

  // ============ FACE SHAPE (Yüz Şekli) ============
  {
    id: 'cheek_puff',
    regionId: 'face_shape',
    title: 'Cheek Puff',
    titleTr: 'Yanak Şişirme',
    description: 'Strengthens cheek muscles and improves facial fullness.',
    descriptionTr: 'Yanak kaslarını güçlendirir ve yüz dolgunluğunu iyileştirir.',
    purpose: 'Hollow cheeks age your face dramatically. This exercise lifts and tones the buccinator muscles to restore youthful facial volume and contour.',
    purposeTr: 'Çökük yanaklar yüzünüzü dramatik şekilde yaşlandırır. Bu egzersiz buccinator kaslarını kaldırıp tonlayarak genç yüz hacmini ve konturunu restore eder.',
    duration: '30 saniye',
    repetitions: '10 tekrar',
    steps: [
      'Take a deep breath',
      'Puff cheeks with air',
      'Hold for 5 seconds',
      'Release slowly through pursed lips',
    ],
    stepsTr: [
      'Derin nefes alın',
      'Yanakları havayla şişirin',
      '5 saniye tutun',
      'Büzülmüş dudaklardan yavaşça bırakın',
    ],
    benefits: ['Tones cheek muscles', 'Improves facial contour', 'Reduces sagging'],
    benefitsTr: ['Yanak kaslarını tonlar', 'Yüz konturunu iyileştirir', 'Sarkmayı azaltır'],
    difficulty: 'easy',
    icon: '🎈',
  },
  {
    id: 'fish_face',
    regionId: 'face_shape',
    title: 'Fish Face',
    titleTr: 'Balık Yüzü',
    description: 'Targets cheek and lip muscles for a slimmer face.',
    descriptionTr: 'Daha ince bir yüz için yanak ve dudak kaslarını hedefler.',
    purpose: 'Facial bloating hides your bone structure. This exercise sculpts cheekbones and slims the face by toning deep facial muscles.',
    purposeTr: 'Yüz şişkinliği kemik yapınızı gizler. Bu egzersiz derin yüz kaslarını tonlayarak elmacık kemiklerini şekillendirir ve yüzü inceltir.',
    duration: '30 saniye',
    repetitions: '12 tekrar',
    steps: [
      'Suck cheeks inward',
      'Pucker lips like a fish',
      'Hold for 3 seconds',
      'Release and repeat',
    ],
    stepsTr: [
      'Yanakları içe doğru çekin',
      'Dudakları balık gibi büzün',
      '3 saniye tutun',
      'Bırakın ve tekrarlayın',
    ],
    benefits: ['Slims face appearance', 'Defines cheekbones', 'Tones facial muscles'],
    benefitsTr: ['Yüz görünümünü inceltir', 'Elmacık kemiklerini tanımlar', 'Yüz kaslarını tonlar'],
    difficulty: 'easy',
    icon: '🐟',
  },
  {
    id: 'face_yoga_v',
    regionId: 'face_shape',
    title: 'V-Shape Exercise',
    titleTr: 'V-Şekli Egzersizi',
    description: 'Creates a V-shaped face contour.',
    descriptionTr: 'V şeklinde yüz konturu oluşturur.',
    purpose: 'V-shaped faces are universally attractive. This advanced exercise lifts the entire face structure for the coveted heart-shaped facial contour.',
    purposeTr: 'V şeklindeki yüzler evrensel olarak çekicidir. Bu ileri seviye egzersiz tüm yüz yapısını kaldırarak arzu edilen kalp şeklindeki yüz konturunu oluşturur.',
    duration: '45 saniye',
    repetitions: '8 tekrar',
    steps: [
      'Place index and middle fingers in V shape at brows',
      'Apply light pressure at outer corners of eyes',
      'Squint lower eyelids upward',
      'Hold for 5 seconds',
    ],
    stepsTr: [
      'İşaret ve orta parmakları kaşlara V şeklinde koyun',
      'Gözlerin dış köşelerine hafif baskı uygulayın',
      'Alt göz kapaklarını yukarı doğru kısın',
      '5 saniye tutun',
    ],
    benefits: ['Creates V-shape contour', 'Lifts drooping areas', 'Improves overall face shape'],
    benefitsTr: ['V-şekli kontur oluşturur', 'Sarkan bölgeleri kaldırır', 'Genel yüz şeklini iyileştirir'],
    difficulty: 'hard',
    icon: '✌️',
  },
];

// Helper functions
export function getExercisesByRegion(regionId: RegionId): Exercise[] {
  return EXERCISES.filter((ex) => ex.regionId === regionId);
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((ex) => ex.id === id);
}

export function getAllRegions(): RegionId[] {
  return ['eyebrows', 'eyes', 'nose', 'lips', 'jawline', 'face_shape'];
}

export function getRegionTitle(regionId: RegionId): string {
  const titles: Record<RegionId, string> = {
    eyebrows: 'Kaşlar',
    eyes: 'Gözler',
    nose: 'Burun',
    lips: 'Dudaklar',
    jawline: 'Çene Hattı',
    face_shape: 'Yüz Şekli',
  };
  return titles[regionId];
}

export function getRegionIcon(regionId: RegionId): string {
  const icons: Record<RegionId, string> = {
    eyebrows: 'git-branch-outline',
    eyes: 'eye-outline',
    nose: 'nose', // MaterialCommunityIcons
    lips: 'ellipse',
    jawline: 'grid-outline',
    face_shape: 'person-circle-outline',
  };
  return icons[regionId];
}

// Icon kütüphanesi belirleme (burun için özel)
export function getRegionIconLibrary(regionId: RegionId): 'ionicons' | 'material-community' {
  return regionId === 'nose' ? 'material-community' : 'ionicons';
}
