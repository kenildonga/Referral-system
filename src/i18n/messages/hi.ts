import type { MessageTree } from './index';

export const hiMessages: MessageTree = {
  'ThrottlerException: Too Many Requests':
    'बहुत अधिक अनुरोध, कृपया बाद में प्रयास करें',
  auth: {
    missingAuthHeader: 'अधिकृतीकरण हेडर गायब है',
    invalidAuthFormat:
      'अमान्य अधिकृतीकरण प्रारूप। Bearer <token> का उपयोग करें',
    invalidOrExpiredToken: 'अमान्य या समाप्त टोकन',
    invalidEmailOrPassword: 'अमान्य ईमेल या पासवर्ड',
    invalidAgentLoginIdOrPassword: 'अमान्य एजेंट लॉगिन आईडी या पासवर्ड',
    currentPasswordIncorrect: 'वर्तमान पासवर्ड गलत है',
    notAuthorized: 'आप यह कार्य करने के लिए अधिकृत नहीं हैं',
    logoutSuccess: 'सफलतापूर्वक लॉग आउट हो गया',
    passwordChangedSuccess: 'पासवर्ड सफलतापूर्वक बदला गया',
    passwordResetSuccess: 'पासवर्ड सफलतापूर्वक रीसेट हो गया',
    forgotPasswordGeneric: 'यदि ईमेल मौजूद है, तो एक OTP भेजा गया है',
  },
  admin: {
    emailExists: 'इस ईमेल वाला एडमिन पहले से मौजूद है',
    notFound: 'आईडी {{id}} वाला एडमिन नहीं मिला',
    cannotDeactivateSelf: 'आप अपना खाता निष्क्रिय नहीं कर सकते',
    cannotModifyLastSuperAdmin:
      'अंतिम सक्रिय सुपर एडमिन को {{action}} नहीं किया जा सकता',
    action: {
      demote: 'पदावनत',
      deactivate: 'निष्क्रिय',
    },
  },
  agent: {
    emailExists: 'इस ईमेल वाला एजेंट पहले से मौजूद है',
    notFound: 'आईडी {{id}} वाला एजेंट नहीं मिला',
    deletedSuccess: 'एजेंट सफलतापूर्वक हटाया गया',
    loginIdGenerationFailed: 'अद्वितीय एजेंट लॉगिन आईडी बनाने में विफल',
  },
  user: {
    notFound: 'आईडी {{id}} वाला उपयोगकर्ता नहीं मिला',
    agentNotFound: 'आईडी {{id}} वाला एजेंट नहीं मिला',
    agentInactive: 'चयनित एजेंट सक्रिय नहीं है',
    agentLocationMismatch:
      'चयनित एजेंट प्रदान किए गए राज्य और शहर से मेल नहीं खाता',
  },
  location: {
    stateNotFound: 'आईडी {{id}} वाला राज्य नहीं मिला',
    cityNotFound: 'आईडी {{id}} वाला शहर नहीं मिला',
  },
  form: {
    notFound: 'फ़ॉर्म नहीं मिला',
    notPublished: 'यह फ़ॉर्म प्रतिक्रियाएँ स्वीकार नहीं कर रहा है',
    deleted: 'फ़ॉर्म सफलतापूर्वक हटाया गया',
    responseNotFound: 'प्रतिक्रिया नहीं मिली',
    responseDeleted: 'प्रतिक्रिया सफलतापूर्वक हटाई गई',
    duplicateFieldId: 'स्कीमा में डुप्लिकेट फ़ील्ड आईडी',
    optionsRequired: 'इस फ़ील्ड प्रकार के लिए कम से कम एक विकल्प आवश्यक है',
    requiredFieldMissing: 'एक आवश्यक फ़ील्ड गायब है',
    fileFieldNotFound: 'इस फ़ॉर्म पर फ़ाइल फ़ील्ड नहीं मिली',
    fileTooLarge: 'फ़ाइल अधिकतम अनुमत आकार से अधिक है',
    fileTypeNotAllowed: 'फ़ाइल प्रकार की अनुमति नहीं है',
    fileNotFound: 'अपलोड की गई फ़ाइल नहीं मिली',
    invalidFileKey: 'अमान्य फ़ाइल संदर्भ',
  },
  otp: {
    invalidOrExpired: 'अमान्य या समाप्त OTP',
    maxAttemptsExceeded: 'अधिकतम OTP प्रयास पार हो गए',
  },
  validation: {
    password: {
      minLength: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए',
      requireLetter: 'पासवर्ड में कम से कम एक अक्षर होना चाहिए',
      requireNumber: 'पासवर्ड में कम से कम एक संख्या होनी चाहिए',
      required: 'पासवर्ड आवश्यक है',
    },
    name: {
      required: 'नाम आवश्यक है',
    },
    firstName: {
      required: 'पहला नाम आवश्यक है',
    },
    lastName: {
      required: 'अंतिम नाम आवश्यक है',
    },
    phoneNumber: {
      invalid: 'फ़ोन नंबर बिना देश कोड के ठीक 10 अंकों का होना चाहिए',
      required: 'फ़ोन नंबर आवश्यक है',
    },
    agentId: {
      invalid: 'अमान्य एजेंट आईडी',
    },
    state: {
      required: 'राज्य आवश्यक है',
    },
    city: {
      required: 'शहर आवश्यक है',
    },
    stateId: {
      invalid: 'अमान्य राज्य आईडी',
    },
    cityId: {
      invalid: 'अमान्य शहर आईडी',
    },
    title: {
      required: 'शीर्षक आवश्यक है',
    },
    fieldId: {
      required: 'फ़ील्ड आईडी आवश्यक है',
    },
    label: {
      required: 'लेबल आवश्यक है',
    },
    fileName: {
      required: 'फ़ाइल नाम आवश्यक है',
    },
    contentType: {
      required: 'सामग्री प्रकार आवश्यक है',
    },
    fileSize: {
      required: 'फ़ाइल आकार आवश्यक है',
    },
    fileKey: {
      required: 'फ़ाइल कुंजी आवश्यक है',
    },
    fileUrl: {
      invalid: 'फ़ाइल URL अमान्य है',
    },
    email: {
      invalid: 'अमान्य ईमेल पता',
    },
    currentPassword: {
      required: 'वर्तमान पासवर्ड आवश्यक है',
    },
    otp: {
      required: 'OTP आवश्यक है',
    },
    agentLoginId: {
      required: 'एजेंट लॉगिन आईडी आवश्यक है',
    },
    atLeastOneField: 'कम से कम एक फ़ील्ड प्रदान करना आवश्यक है',
  },
  http: {
    badRequest: 'खराब अनुरोध',
    paymentRequired: 'भुगतान आवश्यक',
    forbidden: 'निषिद्ध',
    notFound: 'नहीं मिला',
    methodNotAllowed: 'विधि की अनुमति नहीं',
    notAcceptable: 'स्वीकार्य नहीं',
    proxyAuthRequired: 'प्रॉक्सी प्रमाणीकरण आवश्यक',
    requestTimeout: 'अनुरोध समय समाप्त',
    conflict: 'विरोध',
    gone: 'अनुपलब्ध',
    lengthRequired: 'लंबाई आवश्यक',
    preconditionFailed: 'पूर्व शर्त विफल',
    payloadTooLarge: 'पेलोड बहुत बड़ा',
    uriTooLong: 'URI बहुत लंबा',
    unsupportedMediaType: 'असमर्थित मीडिया प्रकार',
    rangeNotSatisfiable: 'रेंज संतोषजनक नहीं',
    expectationFailed: 'अपेक्षा विफल',
    imATeapot: 'मैं एक चायदानी हूँ',
    misdirectedRequest: 'गलत निर्देशित अनुरोध',
    unprocessableEntity: 'अप्रसंस्कृत इकाई',
    locked: 'लॉक किया गया',
    failedDependency: 'निर्भरता विफल',
    tooEarly: 'बहुत जल्दी',
    upgradeRequired: 'अपग्रेड आवश्यक',
    preconditionRequired: 'पूर्व शर्त आवश्यक',
    tooManyRequests: 'बहुत अधिक अनुरोध',
    requestHeaderFieldsTooLarge: 'अनुरोध हेडर फ़ील्ड बहुत बड़े',
    unavailableForLegalReasons: 'कानूनी कारणों से अनुपलब्ध',
    error: 'त्रुटि',
  },
  common: {
    internalServerError: 'आंतरिक सर्वर त्रुटि',
  },
};
