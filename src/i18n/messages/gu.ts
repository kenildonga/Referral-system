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
    notFound: 'આઈડી {{id}} સાથેનો એજન્ટ મળ્યો નથી',
    deletedSuccess: 'એજન્ટ સફળતાપૂર્વક કાઢી નાખ્યો',
    loginIdGenerationFailed: 'અનન્ય એજન્ટ લૉગિન આઈડી બનાવવામાં નિષ્ફળ',
  },
  otp: {
    invalidOrExpired: 'અમાન્ય અથવા સમાપ્ત OTP',
    maxAttemptsExceeded: 'મહત્તમ OTP પ્રયાસો ઓળંગાઈ ગયા',
  },
  validation: {
    password: {
      minLength: 'પાસવર્ડ ઓછામાં ઓછા 8 અક્ષરોનો હોવો જોઈએ',
      requireLetter: 'પાસવર્ડમાં ઓછામાં ઓછો એક અક્ષર હોવો જોઈએ',
      requireNumber: 'પાસવર્ડમાં ઓછામાં ઓછી એક સંખ્યા હોવી જોઈએ',
      required: 'પાસવર્ડ જરૂરી છે',
    },
    name: {
      required: 'નામ જરૂરી છે',
    },
    email: {
      invalid: 'અમાન્ય ઇમેઇલ સરનામું',
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
