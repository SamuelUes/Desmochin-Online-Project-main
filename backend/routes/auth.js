const express = require('express');

const User = require('../models/User');
const {
  createSessionToken,
  getDefaultProfileImage,
  getSessionTokenFromRequest,
  hashPassword,
  makeValidationError,
  sessionCookieOptions,
  toAuthUser,
  validateLoginPayload,
  validateProfileUpdatePayload,
  validateRegisterPayload,
  verifyPassword,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} = require('../lib/auth');

const router = express.Router();

function isDuplicateKeyError(error) {
  return error && typeof error === 'object' && error.code === 11000;
}

async function loadCurrentUser(req, res) {
  const token = getSessionTokenFromRequest(req);
  const session = verifySessionToken(token);

  if (!session) {
    res.status(401).json({ message: 'No hay una sesion activa.' });
    return null;
  }

  const user = await User.findById(session.sub);

  if (!user) {
    res.status(401).json({ message: 'La sesion ya no es valida.' });
    return null;
  }

  if (!user.avatar) {
    user.avatar = getDefaultProfileImage(user.email);
    await user.save();
  }

  return user;
}

router.post('/login', async (req, res) => {
  try {
    const parsed = validateLoginPayload(req.body);

    if (!parsed.ok) {
      return res.status(400).json(parsed);
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const passwordIsValid = await verifyPassword(password, user.passwordHash);

    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    user.lastLogin = new Date();
    if (!user.avatar) {
      user.avatar = getDefaultProfileImage(user.email);
    }
    await user.save();

    const authUser = toAuthUser(user);
    const token = createSessionToken({
      email: authUser.email,
      profileImage: authUser.profileImage,
      sub: authUser.id,
      username: authUser.username,
    });

    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return res.json({
      message: 'Sesion iniciada correctamente.',
      ok: true,
      user: authUser,
    });
  } catch (error) {
    console.error('[auth/login]', error);
    return res.status(500).json({ message: 'No pudimos iniciar sesion.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const parsed = validateRegisterPayload(req.body);

    if (!parsed.ok) {
      return res.status(400).json(parsed);
    }

    const { email, password, username } = parsed.data;
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existingUser) {
      return res.status(409).json({
        message: 'Ya existe una cuenta con ese usuario o correo.',
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      avatar: getDefaultProfileImage(email),
      email,
      lastLogin: new Date(),
      passwordHash,
      username,
    });

    const authUser = toAuthUser(user);
    const token = createSessionToken({
      email: authUser.email,
      profileImage: authUser.profileImage,
      sub: authUser.id,
      username: authUser.username,
    });

    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return res.status(201).json({
      message: 'Cuenta creada correctamente.',
      ok: true,
      user: authUser,
    });
  } catch (error) {
    console.error('[auth/register]', error);

    if (isDuplicateKeyError(error)) {
      return res.status(409).json({
        message: 'Ya existe una cuenta con ese usuario o correo.',
      });
    }

    return res.status(500).json({ message: 'No pudimos crear la cuenta.' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = await loadCurrentUser(req, res);

    if (!user) {
      return null;
    }

    return res.json({
      ok: true,
      user: toAuthUser(user),
    });
  } catch (error) {
    console.error('[auth/me]', error);
    return res.status(500).json({ message: 'No pudimos leer la sesion.' });
  }
});

router.patch('/me', async (req, res) => {
  try {
    const user = await loadCurrentUser(req, res);

    if (!user) {
      return null;
    }

    const parsed = validateProfileUpdatePayload(req.body);

    if (!parsed.ok) {
      return res.status(400).json(parsed);
    }

    const { email, profileImage, username } = parsed.data;
    const duplicatedUser = await User.findOne({
      _id: { $ne: user._id },
      $or: [{ email }, { username }],
    }).lean();

    if (duplicatedUser) {
      return res.status(409).json({
        message: 'Ese usuario o correo ya esta en uso.',
      });
    }

    user.avatar = profileImage;
    user.email = email;
    user.username = username;
    await user.save();

    const authUser = toAuthUser(user);
    const nextToken = createSessionToken({
      email: authUser.email,
      profileImage: authUser.profileImage,
      sub: authUser.id,
      username: authUser.username,
    });

    res.cookie(SESSION_COOKIE_NAME, nextToken, sessionCookieOptions);
    return res.json({
      message: 'Perfil actualizado correctamente.',
      ok: true,
      user: authUser,
    });
  } catch (error) {
    console.error('[auth/me]', error);
    return res.status(500).json({ message: 'No pudimos actualizar el perfil.' });
  }
});

router.post('/logout', async (req, res) => {
  const cookieOptions = {
    ...sessionCookieOptions,
    maxAge: 0,
  };

  res.cookie(SESSION_COOKIE_NAME, '', cookieOptions);
  return res.json({
    message: 'Sesion cerrada correctamente.',
    ok: true,
  });
});

module.exports = router;
