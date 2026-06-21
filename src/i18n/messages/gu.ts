import type { MessageTree } from './index';

export const guMessages: MessageTree = {
  'ThrottlerException: Too Many Requests':
    'ખૂબ વધુ વિનંતીઓ, કૃપા કરીને થોડા સમય પછી પ્રયાસ કરો',
  auth: {
    missingAuthHeader: 'અધિકૃતતા હેડર ગુમ થયેલ છે',
    invalidAuthFormat: 'અમાન્ય અધિકૃતતા ફોર્મેટ. Bearer <token> નો ઉપયોગ કરો',
    invalidOrExpiredToken: 'અમાન્ય અથવા સમાપ્ત ટોકન',
    invalidEmailOrPassword: 'અમાન્ય ઇમેઇલ અથવા પાસવર્ડ',
    invalidAgentLoginIdOrPassword: 'અમાન્ય એજન્ટ લૉગિન આઈડી અથવા પાસવર્ડ',
    invalidUserPhoneNumberOrPassword: 'અમાન્ય ફોન નંબર અથવા પાસવર્ડ',
    currentPasswordIncorrect: 'વર્તમાન પાસવર્ડ ખોટો છે',
    notAuthorized: 'તમે આ ક્રિયા કરવા માટે અધિકૃત નથી',
    logoutSuccess: 'સફળતાપૂર્વક લૉગ આઉટ થયા',
    passwordChangedSuccess: 'પાસવર્ડ સફળતાપૂર્વક બદલાયો',
    passwordResetSuccess: 'પાસવર્ડ સફળતાપૂર્વક રીસેટ થયો',
    forgotPasswordGeneric:
      'જો ઇમેઇલ અસ્તિત્વમાં હોય, તો OTP મોકલવામાં આવ્યો છે',
  },
  admin: {
    emailExists: 'આ ઇમેઇલ સાથેનો એડમિન પહેલેથી અસ્તિત્વમાં છે',
    notFound: 'આઈડી {{id}} સાથેનો એડમિન મળ્યો નથી',
    cannotDeactivateSelf: 'તમે તમારું એકાઉન્ટ નિષ્ક્રિય કરી શકતા નથી',
    cannotModifyLastSuperAdmin:
      'છેલ્લા સક્રિય સુપર એડમિનને {{action}} કરી શકાતા નથી',
    action: {
      demote: 'પદાવનત',
      deactivate: 'નિષ્ક્રિય',
    },
  },
  agent: {
    emailExists: 'આ ઇમેઇલ સાથેનો એજન્ટ પહેલેથી અસ્તિત્વમાં છે',
    phoneNumberExists: 'આ ફોન નંબર સાથેનો એજન્ટ પહેલેથી અસ્તિત્વમાં છે',
    notFound: 'આઈડી {{id}} સાથેનો એજન્ટ મળ્યો નથી',
    deletedSuccess: 'એજન્ટ સફળતાપૂર્વક કાઢી નાખ્યો',
    loginIdGenerationFailed: 'અનન્ય એજન્ટ લૉગિન આઈડી બનાવવામાં નિષ્ફળ',
    signUpSuccess: 'એજન્ટ સફળતાપૂર્વક નોંધાયો',
    profileUpdatedSuccess: 'પ્રોફાઇલ સફળતાપૂર્વક અપડેટ થઈ',
  },
  user: {
    notFound: 'આઈડી {{id}} સાથેનો વપરાશકર્તા મળ્યો નથી',
    deletedSuccess: 'વપરાશકર્તા સફળતાપૂર્વક કાઢી નાખ્યો',
    emailExists: 'આ ઇમેઇલ સાથેનો વપરાશકર્તા પહેલેથી અસ્તિત્વમાં છે',
    phoneNumberExists: 'આ ફોન નંબર સાથેનો વપરાશકર્તા પહેલેથી અસ્તિત્વમાં છે',
    agentNotFound: 'આઈડી {{id}} સાથેનો એજન્ટ મળ્યો નથી',
    agentInactive: 'પસંદ કરેલ એજન્ટ સક્રિય નથી',
    agentLocationMismatch:
      'પસંદ કરેલ એજન્ટ આપેલા રાજ્ય અને શહેર સાથે મેળ ખાતો નથી',
  },
  location: {
    stateNotFound: 'આઈડી {{id}} સાથેનું રાજ્ય મળ્યું નથી',
    cityNotFound: 'આઈડી {{id}} સાથેનું શહેર મળ્યું નથી',
  },
  form: {
    notFound: 'ફોર્મ મળ્યો નથી',
    notPublished: 'આ ફોર્મ પ્રતિસાદ સ્વીકારતું નથી',
    deleted: 'ફોર્મ સફળતાપૂર્વક કાઢી નાખ્યો',
    responseNotFound: 'પ્રતિસાદ મળ્યો નથી',
    responseDeleted: 'પ્રતિસાદ સફળતાપૂર્વક કાઢી નાખ્યો',
    duplicateFieldId: 'સ્કીમામાં ડુપ્લિકેટ ફીલ્ડ આઈડી',
    optionsRequired: 'આ ફીલ્ડ પ્રકાર માટે ઓછામાં ઓછો એક વિકલ્પ જરૂરી છે',
    requiredFieldMissing: 'જરૂરી ફીલ્ડ ગુમ થયેલ છે',
    fileFieldNotFound: 'આ ફોર્મ પર ફાઇલ ફીલ્ડ મળી નથી',
    fileTooLarge: 'ફાઇલ મહત્તમ મંજૂર કદ કરતાં મોટી છે',
    fileTypeNotAllowed: 'ફાઇલ પ્રકાર મંજૂર નથી',
    fileNotFound: 'અપલોડ કરેલી ફાઇલ મળી નથી',
    invalidFileKey: 'અમાન્ય ફાઇલ સંદર્ભ',
  },
  otp: {
    invalidOrExpired: 'અમાન્ય અથવા સમાપ્ત OTP',
    maxAttemptsExceeded: 'મહત્તમ OTP પ્રયાસો ઓળંગાઈ ગયા',
  },
  validation: {
    password: {
      minLength: 'પાસવર્ડ ઓછામાં ઓછા 8 અક્ષરોનો હોવો જોઈએ',
      maxLength: 'પાસવર્ડ વધુમાં વધુ 255 અક્ષરોનો હોવો જોઈએ',
      requireLetter: 'પાસવર્ડમાં ઓછામાં ઓછો એક અક્ષર હોવો જોઈએ',
      requireNumber: 'પાસવર્ડમાં ઓછામાં ઓછી એક સંખ્યા હોવી જોઈએ',
      required: 'પાસવર્ડ જરૂરી છે',
    },
    name: {
      required: 'નામ જરૂરી છે',
    },
    firstName: {
      required: 'પ્રથમ નામ જરૂરી છે',
      maxLength: 'પ્રથમ નામ વધુમાં વધુ 255 અક્ષરોનું હોઈ શકે છે',
    },
    lastName: {
      required: 'છેલ્લું નામ જરૂરી છે',
      maxLength: 'છેલ્લું નામ વધુમાં વધુ 255 અક્ષરોનું હોઈ શકે છે',
    },
    phoneNumber: {
      invalid: 'ફોન નંબર દેશ કોડ વગર ચોક્કસ 10 અંકનો હોવો જોઈએ',
      required: 'ફોન નંબર જરૂરી છે',
    },
    agentId: {
      invalid: 'અમાન્ય એજન્ટ આઈડી',
    },
    state: {
      required: 'રાજ્ય જરૂરી છે',
    },
    city: {
      required: 'શહેર જરૂરી છે',
    },
    stateId: {
      invalid: 'અમાન્ય રાજ્ય આઈડી',
    },
    cityId: {
      invalid: 'અમાન્ય શહેર આઈડી',
    },
    title: {
      required: 'શીર્ષક જરૂરી છે',
    },
    fieldId: {
      required: 'ફીલ્ડ આઈડી જરૂરી છે',
    },
    label: {
      required: 'લેબલ જરૂરી છે',
    },
    fileName: {
      required: 'ફાઇલ નામ જરૂરી છે',
    },
    contentType: {
      required: 'સામગ્રી પ્રકાર જરૂરી છે',
    },
    fileSize: {
      required: 'ફાઇલ કદ જરૂરી છે',
    },
    fileKey: {
      required: 'ફાઇલ કી જરૂરી છે',
    },
    fileUrl: {
      invalid: 'ફાઇલ URL અમાન્ય છે',
    },
    email: {
      invalid: 'અમાન્ય ઇમેઇલ સરનામું',
      required: 'ઇમેઇલ જરૂરી છે',
    },
    currentPassword: {
      required: 'વર્તમાન પાસવર્ડ જરૂરી છે',
    },
    otp: {
      required: 'OTP જરૂરી છે',
    },
    agentLoginId: {
      required: 'એજન્ટ લૉગિન આઈડી જરૂરી છે',
    },
    atLeastOneField: 'ઓછામાં ઓછું એક ફીલ્ડ પ્રદાન કરવું જરૂરી છે',
  },
  http: {
    badRequest: 'ખરાબ વિનંતી',
    paymentRequired: 'ચુકવણી જરૂરી',
    forbidden: 'નિષેધિત',
    notFound: 'મળ્યું નથી',
    methodNotAllowed: 'પદ્ધતિ મંજૂર નથી',
    notAcceptable: 'સ્વીકાર્ય નથી',
    proxyAuthRequired: 'પ્રોક્સી પ્રમાણીકરણ જરૂરી',
    requestTimeout: 'વિનંતી સમય સમાપ્ત',
    conflict: 'વિરોધ',
    gone: 'અનુપલબ્ધ',
    lengthRequired: 'લંબાઈ જરૂરી',
    preconditionFailed: 'પૂર્વશરત નિષ્ફળ',
    payloadTooLarge: 'પેલોડ ખૂબ મોટો',
    uriTooLong: 'URI ખૂબ લાંબું',
    unsupportedMediaType: 'અસમર્થિત મીડિયા પ્રકાર',
    rangeNotSatisfiable: 'રેન્જ સંતોષકારક નથી',
    expectationFailed: 'અપેક્ષા નિષ્ફળ',
    imATeapot: 'હું એક ચહાનો કેટલી છું',
    misdirectedRequest: 'ખોટી દિશામાં વિનંતી',
    unprocessableEntity: 'અપ્રક્રિયાયોગ્ય એન્ટિટી',
    locked: 'લૉક કરેલ',
    failedDependency: 'નિર્ભરતા નિષ્ફળ',
    tooEarly: 'ખૂબ વહેલું',
    upgradeRequired: 'અપગ્રેડ જરૂરી',
    preconditionRequired: 'પૂર્વશરત જરૂરી',
    tooManyRequests: 'ખૂબ વધુ વિનંતીઓ',
    requestHeaderFieldsTooLarge: 'વિનંતી હેડર ફીલ્ડ ખૂબ મોટા',
    unavailableForLegalReasons: 'કાનૂની કારણોસર અનુપલબ્ધ',
    error: 'ભૂલ',
  },
  common: {
    internalServerError: 'આંતરિક સર્વર ભૂલ',
  },
};
