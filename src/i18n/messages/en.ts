export const enMessages = {
  'ThrottlerException: Too Many Requests':
    'Too Many Requests, please try again later',
  auth: {
    missingAuthHeader: 'Missing authorization header',
    invalidAuthFormat: 'Invalid authorization format. Use Bearer <token>',
    invalidOrExpiredToken: 'Invalid or expired token',
    invalidEmailOrPassword: 'Invalid email or password',
    invalidAgentLoginIdOrPassword: 'Invalid agent login ID or password',
    invalidUserPhoneNumberOrPassword: 'Invalid phone number or password',
    currentPasswordIncorrect: 'Current password is incorrect',
    notAuthorized: 'You are not authorized to perform this action',
    logoutSuccess: 'Logged out successfully',
    passwordChangedSuccess: 'Password changed successfully',
    passwordResetSuccess: 'Password reset successfully',
    forgotPasswordGeneric: 'If the phone number exists, an OTP has been sent',
  },
  admin: {
    emailExists: 'Admin with this email already exists',
    phoneNumberExists: 'Admin with this phone number already exists',
    notFound: 'Admin with ID {{id}} not found',
    cannotDeactivateSelf: 'You cannot deactivate your own account',
    cannotModifyLastSuperAdmin: 'Cannot {{action}} the last active super admin',
    action: {
      demote: 'demote',
      deactivate: 'deactivate',
    },
  },
  agent: {
    emailExists: 'Agent with this email already exists',
    phoneNumberExists: 'Agent with this phone number already exists',
    notFound: 'Agent with ID {{id}} not found',
    deletedSuccess: 'Agent deleted successfully',
    loginIdGenerationFailed: 'Failed to generate unique agent login ID',
    signUpSuccess: 'Agent registered successfully',
    profileUpdatedSuccess: 'Profile updated successfully',
  },
  user: {
    notFound: 'User with ID {{id}} not found',
    deletedSuccess: 'User deleted successfully',
    emailExists: 'User with this email already exists',
    phoneNumberExists: 'User with this phone number already exists',
    agentNotFound: 'Agent with ID {{id}} not found',
    agentInactive: 'Selected agent is not active',
    agentLocationMismatch:
      'Selected agent does not match the provided state and city',
    noteRequiredForRejection: 'A rejection note is required when rejecting a user',
    invalidStatusTransition: 'Invalid status transition',
    invalidReferralCode: 'Referral code is invalid or not found',
    referralCodeGenerationFailed: 'Failed to generate a unique referral code',
    approvedSuccess: 'User approved successfully',
    rejectedSuccess: 'User rejected successfully',
    chainIdRequiredForApproval: 'A chain must be selected to approve this user',
    notApprovedForForms:
      'You must be approved by your agent before you can fill out forms',
  },
  location: {
    stateNotFound: 'State with ID {{id}} not found',
    cityNotFound: 'City with ID {{id}} not found',
  },
  chain: {
    notFound: 'Chain with ID {{id}} not found',
    deletedSuccess: 'Chain deleted successfully',
  },
  form: {
    notFound: 'Form not found',
    notPublished: 'This form is not accepting responses',
    deleted: 'Form deleted successfully',
    responseNotFound: 'Response not found',
    responseDeleted: 'Response deleted successfully',
    duplicateFieldId: 'Duplicate field ID in schema',
    optionsRequired: 'This field type requires at least one option',
    requiredFieldMissing: 'A required field is missing',
    fileFieldNotFound: 'File field not found on this form',
    fileTooLarge: 'File exceeds the maximum allowed size',
    fileTypeNotAllowed: 'File type is not allowed',
    fileNotFound: 'Uploaded file not found',
    invalidFileKey: 'Invalid file reference',
    invalidSubmissionUserType:
      'This form is not available for your account type',
  },
  otp: {
    invalidOrExpired: 'Invalid or expired OTP',
    maxAttemptsExceeded: 'Maximum OTP attempts exceeded',
  },
  validation: {
    password: {
      minLength: 'Password must be at least 8 characters',
      maxLength: 'Password must be at most 255 characters',
      requireLetter: 'Password must contain at least one letter',
      requireNumber: 'Password must contain at least one number',
      required: 'Password is required',
    },
    name: {
      required: 'Name is required',
    },
    firstName: {
      required: 'First name is required',
      maxLength: 'First name must be at most 255 characters',
    },
    lastName: {
      required: 'Last name is required',
      maxLength: 'Last name must be at most 255 characters',
    },
    middleName: {
      maxLength: 'Middle name must be at most 255 characters',
    },
    phoneNumber: {
      invalid: 'Phone number must be exactly 10 digits with no country code',
      required: 'Phone number is required',
    },
    agentId: {
      invalid: 'Invalid agent ID',
    },
    state: {
      required: 'State is required',
    },
    city: {
      required: 'City is required',
    },
    stateId: {
      invalid: 'Invalid state ID',
    },
    cityId: {
      invalid: 'Invalid city ID',
    },
    title: {
      required: 'Title is required',
    },
    fieldId: {
      required: 'Field ID is required',
    },
    label: {
      required: 'Label is required',
    },
    fileName: {
      required: 'File name is required',
    },
    contentType: {
      required: 'Content type is required',
    },
    fileSize: {
      required: 'File size is required',
    },
    fileKey: {
      required: 'File key is required',
    },
    fileUrl: {
      invalid: 'File URL is invalid',
    },
    email: {
      invalid: 'Invalid email address',
      required: 'Email is required',
    },
    currentPassword: {
      required: 'Current password is required',
    },
    otp: {
      required: 'OTP is required',
    },
    agentLoginId: {
      required: 'Agent login ID is required',
    },
    atLeastOneField: 'At least one field must be provided',
  },
  http: {
    badRequest: 'Bad Request',
    paymentRequired: 'Payment Required',
    forbidden: 'Forbidden',
    notFound: 'Not Found',
    methodNotAllowed: 'Method Not Allowed',
    notAcceptable: 'Not Acceptable',
    proxyAuthRequired: 'Proxy Authentication Required',
    requestTimeout: 'Request Timeout',
    conflict: 'Conflict',
    gone: 'Gone',
    lengthRequired: 'Length Required',
    preconditionFailed: 'Precondition Failed',
    payloadTooLarge: 'Payload Too Large',
    uriTooLong: 'URI Too Long',
    unsupportedMediaType: 'Unsupported Media Type',
    rangeNotSatisfiable: 'Range Not Satisfiable',
    expectationFailed: 'Expectation Failed',
    imATeapot: "I'm a teapot",
    misdirectedRequest: 'Misdirected Request',
    unprocessableEntity: 'Unprocessable Entity',
    locked: 'Locked',
    failedDependency: 'Failed Dependency',
    tooEarly: 'Too Early',
    upgradeRequired: 'Upgrade Required',
    preconditionRequired: 'Precondition Required',
    tooManyRequests: 'Too Many Requests',
    requestHeaderFieldsTooLarge: 'Request Header Fields Too Large',
    unavailableForLegalReasons: 'Unavailable For Legal Reasons',
    error: 'Error',
  },
  common: {
    internalServerError: 'Internal server error',
  },
} as const;
