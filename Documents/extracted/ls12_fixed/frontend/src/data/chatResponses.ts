import type { LangCode } from "@/i18n/languages";

export type ChatTopic = "tenant" | "rti" | "consumer" | "labour" | "property" | "women" | "generic";

export interface ChatResponseDef {
  topic: ChatTopic;
  /** AI replies in each language */
  text: Record<LangCode, string>;
  /** Always English (law citation) */
  law: string;
  /** Followup suggestion translation keys */
  followupKeys: [string, string];
  /** Full law text (English) shown in bottom sheet */
  fullLaw: string;
}

const en = (text: string): Record<LangCode, string> => ({
  kn: text, hi: text, en: text, mr: text, tu: text, kk: text, te: text, ta: text,
});

const fill = (overrides: Partial<Record<LangCode, string>>, fallback: string): Record<LangCode, string> => ({
  ...en(fallback),
  ...overrides,
});

export const CHAT_RESPONSES: Record<ChatTopic, ChatResponseDef> = {
  tenant: {
    topic: "tenant",
    text: fill({
      en: "Under Indian tenancy law, your landlord must give 15 days' written notice for a monthly tenancy. A 7-day verbal notice is not legally valid for eviction. You can refuse to vacate and demand a written notice.",
      hi: "भारतीय किरायेदारी कानून के तहत, मासिक किरायेदारी के लिए मकान मालिक को 15 दिन का लिखित नोटिस देना अनिवार्य है। 7 दिन का मौखिक नोटिस कानूनी रूप से मान्य नहीं है। आप घर खाली करने से इनकार कर सकते हैं और लिखित नोटिस की मांग कर सकते हैं।",
      kn: "ಭಾರತೀಯ ಬಾಡಿಗೆ ಕಾನೂನಿನ ಪ್ರಕಾರ, ಮಾಸಿಕ ಬಾಡಿಗೆಗೆ ಮನೆಮಾಲೀಕರು 15 ದಿನಗಳ ಲಿಖಿತ ನೋಟಿಸ್ ನೀಡಬೇಕು. 7 ದಿನಗಳ ಮೌಖಿಕ ನೋಟಿಸ್ ಕಾನೂನುಬದ್ಧವಲ್ಲ. ನೀವು ಮನೆ ಬಿಡಲು ನಿರಾಕರಿಸಬಹುದು ಮತ್ತು ಲಿಖಿತ ನೋಟಿಸ್ ಕೇಳಬಹುದು.",
      mr: "भारतीय भाडेकरू कायद्यानुसार, मासिक भाड्यासाठी घरमालकाने 15 दिवसांची लिखित नोटीस द्यावी लागते. 7 दिवसांची तोंडी नोटीस कायदेशीर नाही. तुम्ही जागा सोडण्यास नकार देऊ शकता आणि लिखित नोटीस मागू शकता.",
      te: "భారతీయ అద్దె చట్టం ప్రకారం, నెలవారీ అద్దెకు యజమాని 15 రోజుల లిఖిత నోటీసు ఇవ్వాలి. 7 రోజుల మౌఖిక నోటీసు చెల్లదు. మీరు ఖాళీ చేయడాన్ని నిరాకరించవచ్చు మరియు లిఖిత నోటీసును అడగవచ్చు.",
      ta: "இந்திய வாடகைச் சட்டத்தின்படி, மாதாந்திர வாடகைக்கு வீட்டு உரிமையாளர் 15 நாட்கள் எழுத்து அறிவிப்பு வழங்க வேண்டும். 7 நாள் வாய்மொழி அறிவிப்பு செல்லாது. நீங்கள் வெளியேற மறுக்கலாம், எழுத்து அறிவிப்பு கேட்கலாம்.",
      tu: "ಭಾರತೀಯ ಬಾಡಿಗೆ ಕಾನೂನಿನ ಪ್ರಕಾರ ಮನೆದೆಣ್ಣರು 15 ದಿನೊತ ಲಿಖಿತ ನೋಟಿಸ್ ಕೊರೋಡು. 7 ದಿನೊತ ಮಾತು ನೋಟಿಸ್ ಕಾನೂನುಬದ್ಧ ಆಪುಜಿ.",
      kk: "भारतीय भाडेकरू कायद्यान्वय, घरमालकान 15 दिसांची लिखित नोटीस दिवपाक जाय. 7 दिसांची तोंडी नोटीस कायदेशीर ना.",
    }, "Under Indian tenancy law, your landlord must give 15 days' written notice."),
    law: "Section 106, Transfer of Property Act, 1882",
    followupKeys: ["sugRti", "sugSalary"],
    fullLaw: "Section 106, Transfer of Property Act, 1882: In the absence of a contract, a lease of immovable property for any purpose other than agricultural or manufacturing shall be deemed to be a lease from month to month, terminable on the part of either lessor or lessee, by 15 days' notice in writing.",
  },
  rti: {
    topic: "rti",
    text: fill({
      en: "You can file an RTI under the RTI Act 2005 by writing an application to the Public Information Officer (PIO) of the concerned department. Pay ₹10 fee (free for BPL). The PIO must reply within 30 days.",
      hi: "RTI अधिनियम 2005 के तहत संबंधित विभाग के लोक सूचना अधिकारी (PIO) को आवेदन देकर RTI दाखिल कर सकते हैं। ₹10 शुल्क (BPL के लिए मुफ्त)। PIO को 30 दिन में जवाब देना होगा।",
      kn: "RTI ಕಾಯ್ದೆ 2005 ಅಡಿಯಲ್ಲಿ ಸಂಬಂಧಪಟ್ಟ ಇಲಾಖೆಯ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ (PIO) ಅವರಿಗೆ ಅರ್ಜಿ ಬರೆದು RTI ಸಲ್ಲಿಸಬಹುದು. ₹10 ಶುಲ್ಕ (BPLಗೆ ಉಚಿತ). PIO 30 ದಿನಗಳಲ್ಲಿ ಉತ್ತರಿಸಬೇಕು.",
      mr: "RTI कायदा 2005 अंतर्गत संबंधित विभागाच्या जन माहिती अधिकाऱ्याला (PIO) अर्ज करून RTI दाखल करू शकता. ₹10 शुल्क (BPL साठी मोफत). PIO 30 दिवसांत उत्तर द्यावे.",
      te: "RTI చట్టం 2005 ప్రకారం సంబంధిత విభాగం యొక్క పబ్లిక్ ఇన్ఫర్మేషన్ ఆఫీసర్ (PIO)కి దరఖాస్తు రాసి RTI దాఖలు చేయవచ్చు. ₹10 ఫీజు (BPLకి ఉచితం). PIO 30 రోజుల్లో సమాధానం ఇవ్వాలి.",
      ta: "RTI சட்டம் 2005 இன் கீழ் தொடர்புடைய துறையின் பொது தகவல் அதிகாரிக்கு (PIO) விண்ணப்பம் எழுதி RTI தாக்கல் செய்யலாம். ₹10 கட்டணம் (BPLக்கு இலவசம்). PIO 30 நாட்களில் பதிலளிக்க வேண்டும்.",
      tu: "RTI ಕಾಯ್ದೆ 2005 ಪ್ರಕಾರ ಇಲಾಖೆಯ PIO ಗ್ ಅರ್ಜಿ ಕೊರ್ದು RTI ಸಲ್ಲಿಸೊಡು. ₹10 ಫೀ. PIO 30 ದಿನೊಡು ಉತ್ತರ ಕೊರೋಡು.",
      kk: "RTI कायदो 2005 खाला संबंधित विभागाच्या PIO क अर्ज दिवन RTI दाखल करयेत.",
    }, "You can file an RTI under the RTI Act 2005."),
    law: "Section 6, Right to Information Act, 2005",
    followupKeys: ["sugTenant", "sugSalary"],
    fullLaw: "Section 6, RTI Act 2005: A person who desires information shall make a request in writing to the PIO of the concerned public authority, specifying the particulars of information sought. Fee of ₹10 applies; reply must be furnished within 30 days.",
  },
  consumer: {
    topic: "consumer",
    text: fill({
      en: "Under the Consumer Protection Act 2019, you can file a complaint with the District Consumer Commission for refund, replacement, or compensation. Online complaints can be filed at consumerhelpline.gov.in. No lawyer is needed.",
      hi: "उपभोक्ता संरक्षण अधिनियम 2019 के तहत रिफंड, बदलाव या मुआवज़े के लिए जिला उपभोक्ता आयोग में शिकायत दर्ज कर सकते हैं। consumerhelpline.gov.in पर ऑनलाइन शिकायत कर सकते हैं। वकील की ज़रूरत नहीं।",
      kn: "ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2019 ಅಡಿಯಲ್ಲಿ ಮರುಪಾವತಿ, ಬದಲಾವಣೆ ಅಥವಾ ಪರಿಹಾರಕ್ಕಾಗಿ ಜಿಲ್ಲಾ ಗ್ರಾಹಕ ಆಯೋಗದಲ್ಲಿ ದೂರು ದಾಖಲಿಸಬಹುದು. consumerhelpline.gov.in ನಲ್ಲಿ ಆನ್‌ಲೈನ್ ಸಹ ಸಾಧ್ಯ. ವಕೀಲರ ಅಗತ್ಯವಿಲ್ಲ.",
      mr: "ग्राहक संरक्षण कायदा 2019 अंतर्गत परतावा, बदली किंवा भरपाईसाठी जिल्हा ग्राहक आयोगात तक्रार दाखल करू शकता. consumerhelpline.gov.in वर ऑनलाइनही शक्य.",
      te: "వినియోగదారు రక్షణ చట్టం 2019 ప్రకారం రిఫండ్, మార్పిడి లేదా పరిహారానికి జిల్లా వినియోగదారు కమిషన్‌కి ఫిర్యాదు చేయవచ్చు. consumerhelpline.gov.in లో ఆన్‌లైన్‌గా కూడా ఫైల్ చేయవచ్చు.",
      ta: "நுகர்வோர் பாதுகாப்புச் சட்டம் 2019 இன் கீழ் ரிஃபண்ட், மாற்று அல்லது இழப்பீட்டுக்கு மாவட்ட நுகர்வோர் ஆணையத்திடம் புகார் அளிக்கலாம். consumerhelpline.gov.in இல் ஆன்லைனில் கூட முடியும்.",
      tu: "ಗ್ರಾಹಕ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2019 ಅಡಿಯಡಿ ಜಿಲ್ಲಾ ಗ್ರಾಹಕ ಆಯೋಗೊಡು ದೂರು ಕೊರೊಡು.",
      kk: "ग्राहक संरक्षण कायदो 2019 खाला जिल्हा ग्राहक आयोगांत तक्रार दाखल करयेत.",
    }, "You can file a consumer complaint under the Consumer Protection Act 2019."),
    law: "Section 35, Consumer Protection Act, 2019",
    followupKeys: ["sugTenant", "sugRti"],
    fullLaw: "Section 35, Consumer Protection Act 2019: A complaint may be filed with the District Commission within whose jurisdiction the cause of action wholly or partly arose, or the opposite party resides or carries on business.",
  },
  labour: {
    topic: "labour",
    text: fill({
      en: "Non-payment of salary is illegal under the Payment of Wages Act 1936. You can file a complaint with the Labour Commissioner of your district. Wages must be paid by the 7th of the next month for small establishments and 10th for larger ones.",
      hi: "वेतन न देना भुगतान वेतन अधिनियम 1936 के तहत अवैध है। आप अपने जिले के श्रम आयुक्त के पास शिकायत दर्ज कर सकते हैं। छोटी संस्थानों में 7 तारीख और बड़ी में 10 तारीख तक वेतन देना अनिवार्य है।",
      kn: "ವೇತನ ಪಾವತಿ ಕಾಯ್ದೆ 1936 ಅಡಿಯಲ್ಲಿ ಸಂಬಳ ನೀಡದಿರುವುದು ಕಾನೂನುಬಾಹಿರ. ನಿಮ್ಮ ಜಿಲ್ಲಾ ಕಾರ್ಮಿಕ ಆಯುಕ್ತರಿಗೆ ದೂರು ಸಲ್ಲಿಸಬಹುದು. ಚಿಕ್ಕ ಸಂಸ್ಥೆಗಳಲ್ಲಿ 7ರ ಒಳಗೆ ಮತ್ತು ದೊಡ್ಡ ಸಂಸ್ಥೆಗಳಲ್ಲಿ 10ರ ಒಳಗೆ ಸಂಬಳ ನೀಡಬೇಕು.",
      mr: "वेतन न देणे हे वेतन अदायगी कायदा 1936 अंतर्गत बेकायदेशीर आहे. जिल्हा कामगार आयुक्तांकडे तक्रार दाखल करू शकता.",
      te: "జీతం చెల్లించకపోవడం వేతన చెల్లింపు చట్టం 1936 కింద చట్టవిరుద్ధం. మీ జిల్లా శ్రామిక కమిషనర్‌కి ఫిర్యాదు చేయవచ్చు.",
      ta: "சம்பளம் வழங்காதது ஊதியம் வழங்கும் சட்டம் 1936 இன் கீழ் சட்டவிரோதம். உங்கள் மாவட்ட தொழிலாளர் ஆணையரிடம் புகார் அளிக்கலாம்.",
      tu: "ಸಂಬಳ ಕೊರ್‌ಪುಜಿ ಪನ್ಪಿನವು ಕಾನೂನುಬಾಹಿರ. ಜಿಲ್ಲಾ ಕಾರ್ಮಿಕ ಆಯುಕ್ತೆರೆಗ್ ದೂರು ಕೊರೊಡು.",
      kk: "वेतन दिवप ना तर वेतन अदायगी कायदो 1936 खाला बेकायदेशीर.",
    }, "Non-payment of salary is illegal under the Payment of Wages Act 1936."),
    law: "Section 5, Payment of Wages Act, 1936",
    followupKeys: ["sugTenant", "sugRti"],
    fullLaw: "Section 5, Payment of Wages Act 1936: The wages of every person employed shall be paid before the expiry of the 7th day or 10th day after the last day of the wage period in respect of which the wages are payable, depending on the size of the establishment.",
  },
  property: {
    topic: "property",
    text: fill({
      en: "Property disputes in India are governed by the Transfer of Property Act 1882 and state-specific laws. Always check the title deed and encumbrance certificate. You can file a civil suit in the District Civil Court where the property is located.",
      hi: "भारत में संपत्ति विवाद संपत्ति हस्तांतरण अधिनियम 1882 और राज्य कानूनों से नियंत्रित होते हैं। हमेशा टाइटल डीड और एनकम्ब्रेंस सर्टिफिकेट देखें। संपत्ति जहाँ है उस जिला सिविल कोर्ट में दीवानी मुकदमा कर सकते हैं।",
      kn: "ಭಾರತದಲ್ಲಿ ಆಸ್ತಿ ವಿವಾದಗಳನ್ನು ಆಸ್ತಿ ವರ್ಗಾವಣೆ ಕಾಯ್ದೆ 1882 ನಿಯಂತ್ರಿಸುತ್ತದೆ. ಯಾವಾಗಲೂ ಮಾಲೀಕತ್ವ ಪತ್ರ ಮತ್ತು ಎನ್‌ಕಂಬ್ರನ್ಸ್ ಪ್ರಮಾಣಪತ್ರ ಪರಿಶೀಲಿಸಿ. ಆಸ್ತಿ ಇರುವ ಜಿಲ್ಲಾ ಸಿವಿಲ್ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಕಾನೂನು ದಾವೆ ಹೂಡಬಹುದು.",
      mr: "भारतात मालमत्ता वाद मालमत्ता हस्तांतरण कायदा 1882 अंतर्गत येतात.",
      te: "భారతదేశంలో ఆస్తి వివాదాలు ఆస్తి బదిలీ చట్టం 1882 కింద ఉంటాయి.",
      ta: "இந்தியாவில் சொத்து தகராறுகள் சொத்து மாற்றுச் சட்டம் 1882 இன் கீழ் வரும்.",
      tu: "ಆಸ್ತಿ ತಕರಾರ್ ಆಸ್ತಿ ಬದಲಾವಣೆ ಕಾಯ್ದೆ 1882 ಅಡಿಯಡಿ ಬರ್ಪಿನವು.",
      kk: "मालमत्ता वाद मालमत्ता हस्तांतरण कायदो 1882 खाला येतात.",
    }, "Property disputes in India are governed by the Transfer of Property Act 1882."),
    law: "Section 54, Transfer of Property Act, 1882",
    followupKeys: ["sugTenant", "sugRti"],
    fullLaw: "Section 54, Transfer of Property Act 1882: 'Sale' is defined as a transfer of ownership in exchange for a price paid or promised. A sale of immovable property of value ₹100 and upwards must be made by a registered instrument.",
  },
  women: {
    topic: "women",
    text: fill({
      en: "If you are facing domestic violence, you are protected under the Protection of Women from Domestic Violence Act 2005. You can call the women's helpline 1091 or 181, file a complaint at any police station regardless of jurisdiction, and seek a protection order from a magistrate.",
      hi: "घरेलू हिंसा का सामना कर रही हैं तो आप घरेलू हिंसा से महिलाओं की सुरक्षा अधिनियम 2005 के तहत संरक्षित हैं। महिला हेल्पलाइन 1091 या 181 पर कॉल करें, किसी भी थाने में FIR दर्ज करें, और मजिस्ट्रेट से सुरक्षा आदेश ले सकती हैं।",
      kn: "ನೀವು ಗೃಹ ಹಿಂಸೆಗೆ ಒಳಗಾಗಿದ್ದರೆ ಗೃಹ ಹಿಂಸೆಯಿಂದ ಮಹಿಳೆಯರ ರಕ್ಷಣಾ ಕಾಯ್ದೆ 2005 ನಿಮ್ಮನ್ನು ರಕ್ಷಿಸುತ್ತದೆ. ಮಹಿಳಾ ಸಹಾಯವಾಣಿ 1091 ಅಥವಾ 181 ಗೆ ಕರೆ ಮಾಡಿ, ಯಾವುದೇ ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ FIR ದಾಖಲಿಸಿ, ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್‌ನಿಂದ ಸಂರಕ್ಷಣಾ ಆದೇಶ ಪಡೆಯಿರಿ.",
      mr: "घरगुती हिंसेला सामोरे जात असाल तर तुम्ही घरगुती हिंसा संरक्षण कायदा 2005 अंतर्गत संरक्षित आहात. महिला हेल्पलाईन 1091 / 181 वर कॉल करा.",
      te: "మీరు గృహ హింసను ఎదుర్కొంటే గృహ హింస నుండి మహిళల రక్షణ చట్టం 2005 మిమ్మల్ని కాపాడుతుంది. మహిళా హెల్ప్‌లైన్ 1091 / 181 కు కాల్ చేయండి.",
      ta: "வீட்டு வன்முறையை எதிர்கொண்டால் வீட்டு வன்முறையிலிருந்து பெண்கள் பாதுகாப்புச் சட்டம் 2005 உங்களைப் பாதுகாக்கும். மகளிர் உதவி எண் 1091 / 181 அழைக்கவும்.",
      tu: "ಗೃಹ ಹಿಂಸೆ ಆತ್ಂಡ ಮಹಿಳಾ ಹೆಲ್ಪ್‌ಲೈನ್ 1091 ಗ್ ಕರೆ ಮಲ್ಪುಲೆ.",
      kk: "घरगुती हिंसा जाली जाल्यार महिला हेल्पलाइन 1091 क उलो.",
    }, "You are protected under the Protection of Women from Domestic Violence Act 2005."),
    law: "Section 3, Protection of Women from Domestic Violence Act, 2005",
    followupKeys: ["sugTenant", "sugRti"],
    fullLaw: "Section 3, PWDV Act 2005: 'Domestic violence' includes any act, omission, or conduct of the respondent that harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person.",
  },
  generic: {
    topic: "generic",
    text: fill({
      en: "Thank you for your question. Could you share more details about your situation? You can ask about tenant rights, RTI filing, consumer complaints, salary disputes, property issues, or women's safety, and I'll guide you with the relevant Indian law.",
      hi: "आपके सवाल के लिए धन्यवाद। कृपया अपनी स्थिति के बारे में और जानकारी दें। आप किरायेदार अधिकार, RTI, उपभोक्ता शिकायत, वेतन विवाद, संपत्ति या महिला सुरक्षा से जुड़े सवाल पूछ सकते हैं।",
      kn: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಧನ್ಯವಾದಗಳು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ವಿವರ ಹಂಚಿಕೊಳ್ಳಿ. ಬಾಡಿಗೆ, RTI, ಗ್ರಾಹಕ ದೂರು, ಸಂಬಳ ವಿವಾದ, ಆಸ್ತಿ ಅಥವಾ ಮಹಿಳಾ ಸುರಕ್ಷತೆ ಬಗ್ಗೆ ಕೇಳಬಹುದು.",
      mr: "तुमच्या प्रश्नाबद्दल धन्यवाद. कृपया अधिक तपशील द्या.",
      te: "మీ ప్రశ్నకు ధన్యవాదాలు. దయచేసి మరిన్ని వివరాలు పంచుకోండి.",
      ta: "உங்கள் கேள்விக்கு நன்றி. தயவுசெய்து மேலும் விவரங்களைப் பகிரவும்.",
      tu: "ನಿಕುಲೆನ ಪ್ರಶ್ನೆಗ್ ವಂದನೆ. ಪೂರಾ ವಿವರ ಕೊರ್‌ಲೆ.",
      kk: "तुमच्या प्रश्नाक धन्यवाद. चड माहिती दिवात.",
    }, "Thank you. Could you share more details?"),
    law: "General guidance",
    followupKeys: ["sugTenant", "sugRti"],
    fullLaw: "Please provide more context to receive accurate citations.",
  },
};

const KEYWORDS: Array<{ topic: ChatTopic; words: string[] }> = [
  { topic: "tenant", words: ["tenant", "landlord", "evict", "rent", "vacate", "किरायेदार", "मकान", "ಬಾಡಿಗೆ", "ಮನೆಮಾಲೀಕ", "भाडेकरू", "घरमालक", "అద్దె", "యజమాని", "வாடகை", "வீட்டு உரிமையாளர்"] },
  { topic: "rti", words: ["rti", "right to information", "सूचना", "ಮಾಹಿತಿ", "माहिती", "సమాచారం", "தகவல்"] },
  { topic: "consumer", words: ["consumer", "refund", "defective", "उपभोक्ता", "ग्राहक", "ಗ್ರಾಹಕ", "वस्तू", "వినియోగదారు", "நுகர்வோர்"] },
  { topic: "labour", words: ["salary", "wage", "employer", "labour", "labor", "वेतन", "नियोक्ता", "ಸಂಬಳ", "ಉದ್ಯೋಗ", "पगार", "जीतం", "जీతం", "சம்பளம்", "முதலாளி"] },
  { topic: "property", words: ["property", "land", "deed", "encroach", "संपत्ति", "ज़मीन", "ಆಸ್ತಿ", "ಭೂಮಿ", "मालमत्ता", "जमीन", "ఆస్తి", "சொத்து", "நிலம்"] },
  { topic: "women", words: ["women", "domestic", "harass", "wife", "महिला", "घरेलू", "ಮಹಿಳಾ", "ಗೃಹ", "महिला", "घरगुती", "మహిళ", "గృహ", "பெண்", "வீட்டு வன்முறை"] },
];

export const matchTopic = (text: string): ChatTopic => {
  const lower = text.toLowerCase();
  for (const k of KEYWORDS) {
    if (k.words.some((w) => lower.includes(w.toLowerCase()))) return k.topic;
  }
  return "generic";
};
