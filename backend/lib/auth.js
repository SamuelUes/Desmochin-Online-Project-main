const crypto = require('node:crypto');

const SESSION_COOKIE_NAME = 'condega_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_COOKIE_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

const DEFAULT_PROFILE_IMAGES = [
  '/Profile 1.png',
  '/Profile 2.png',
  '/Profile 3.png',
  '/Profile 4.png',
];

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 chars.');
  }

  return secret;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sign(value) {
  return base64Url(
    crypto.createHmac('sha256', getAuthSecret()).update(value).digest(),
  );
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });

  return `scrypt:${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  const [algorithm, salt, storedKey] = String(passwordHash || '').split(':');

  if (algorithm !== 'scrypt' || !salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, 'hex');
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, storedBuffer.length, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });

  const derivedBuffer = Buffer.from(derivedKey);

  return (
    storedBuffer.length === derivedBuffer.length &&
    crypto.timingSafeEqual(storedBuffer, derivedBuffer)
  );
}

function createSessionToken(payload, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encodedPayload = base64Url(JSON.stringify(data));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifySessionToken(token) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = String(token).split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    );

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getDefaultProfileImage(seed) {
  const normalizedSeed = String(seed || '').trim().toLowerCase() || 'condega';
  const total = Array.from(normalizedSeed).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return DEFAULT_PROFILE_IMAGES[total % DEFAULT_PROFILE_IMAGES.length];
}

function getProfileImageOrDefault(profileImage, seed) {
  if (profileImage && DEFAULT_PROFILE_IMAGES.includes(profileImage)) {
    return profileImage;
  }

  return getDefaultProfileImage(seed);
}

function toAuthUser(user) {
  return {
    email: user.email,
    id: user._id.toString(),
    profileImage: getProfileImageOrDefault(user.avatar, user.email),
    username: user.username,
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUsername(value) {
  return /^[a-zA-Z0-9_]+$/.test(value);
}

function makeValidationError(message, errors) {
  return { errors, message, ok: false };
}

function validateLoginPayload(body) {
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const errors = {};

  if (!email) {
    errors.email = 'El correo electronico es obligatorio.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Ingresa un correo electronico valido.';
  }

  if (!password) {
    errors.password = 'La contrasena es obligatoria.';
  } else if (password.length < 8) {
    errors.password = 'La contrasena debe tener al menos 8 caracteres.';
  }

  if (Object.keys(errors).length > 0) {
    return makeValidationError('Revisa los datos del formulario.', errors);
  }

  return { data: { email, password }, ok: true };
}

function validateRegisterPayload(body) {
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const confirmPassword =
    typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';
  const terms = Boolean(body?.terms);
  const errors = {};

  if (username.length < 3) {
    errors.username = 'El usuario debe tener al menos 3 caracteres.';
  } else if (username.length > 24) {
    errors.username = 'El usuario no puede superar 24 caracteres.';
  } else if (!isValidUsername(username)) {
    errors.username = 'Usa solo letras, numeros y guion bajo.';
  }

  if (!email) {
    errors.email = 'El correo electronico es obligatorio.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Ingresa un correo electronico valido.';
  }

  if (password.length < 8) {
    errors.password = 'La contrasena debe tener al menos 8 caracteres.';
  } else if (!/[A-Za-z]/.test(password)) {
    errors.password = 'La contrasena debe incluir una letra.';
  } else if (!/[0-9]/.test(password)) {
    errors.password = 'La contrasena debe incluir un numero.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirma tu contrasena.';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Las contrasenas no coinciden.';
  }

  if (!terms) {
    errors.terms = 'Debes aceptar los terminos y condiciones.';
  }

  if (Object.keys(errors).length > 0) {
    return makeValidationError('Revisa los datos del formulario.', errors);
  }

  return {
    data: { confirmPassword, email, password, terms, username },
    ok: true,
  };
}

function validateProfileUpdatePayload(body) {
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const profileImage =
    typeof body?.profileImage === 'string' ? body.profileImage : '';
  const errors = {};

  if (!email) {
    errors.email = 'El correo electronico es obligatorio.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Ingresa un correo electronico valido.';
  }

  if (username.length < 3) {
    errors.username = 'El usuario debe tener al menos 3 caracteres.';
  } else if (username.length > 24) {
    errors.username = 'El usuario no puede superar 24 caracteres.';
  } else if (!isValidUsername(username)) {
    errors.username = 'Usa solo letras, numeros y guion bajo.';
  }

  if (!DEFAULT_PROFILE_IMAGES.includes(profileImage)) {
    errors.profileImage = 'Selecciona una foto de perfil valida.';
  }

  if (Object.keys(errors).length > 0) {
    return makeValidationError('Revisa los datos del perfil.', errors);
  }

  return { data: { email, profileImage, username }, ok: true };
}

function parseCookies(cookieHeader = '') {
  return String(cookieHeader)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return cookies;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function getSessionTokenFromRequest(req) {
  return parseCookies(req.headers.cookie || '')[SESSION_COOKIE_NAME];
}

const sessionCookieOptions = {
  httpOnly: true,
  maxAge: SESSION_COOKIE_MAX_AGE_MS,
  path: '/',
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
};

module.exports = {
  DEFAULT_PROFILE_IMAGES,
  SESSION_COOKIE_MAX_AGE_MS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getDefaultProfileImage,
  getProfileImageOrDefault,
  getSessionTokenFromRequest,
  hashPassword,
  makeValidationError,
  parseCookies,
  sessionCookieOptions,
  toAuthUser,
  validateLoginPayload,
  validateProfileUpdatePayload,
  validateRegisterPayload,
  verifyPassword,
  verifySessionToken,
};
