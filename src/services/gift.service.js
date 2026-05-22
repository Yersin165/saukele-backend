const prisma = require('../config/database');

const ensureVendorProductsWeddingProfile = async () => {
  const systemAccount = await prisma.user.upsert({
    where: { email: 'system@localhost' },
    update: {},
    create: {
      id: 'system',
      email: 'system@localhost',
      passwordHash: '',
      role: 'COUPLE',
      isVerified: true,
    },
  });

  let globalProfile = await prisma.weddingProfile.findUnique({
    where: { inviteCode: 'VENDOR_PRODUCTS' },
  });

  if (!globalProfile) {
    globalProfile = await prisma.weddingProfile.create({
      data: {
        coupleId: systemAccount.id,
        brideName: 'Vendor Products',
        groomName: 'Global Catalog',
        weddingDate: new Date(),
        location: 'Vendor Marketplace',
        inviteCode: 'VENDOR_PRODUCTS',
        weddingType: 'CITY',
      },
    });
  }

  return globalProfile;
};

const getVendorProductsWeddingProfileId = async () => {
  const profile = await ensureVendorProductsWeddingProfile();
  return profile.id;
};

const create = async (data) => {
  const weddingProfileId = typeof data.weddingProfileId === 'string'
    ? data.weddingProfileId.trim()
    : data.weddingProfileId;

  const hasWeddingProfileId = weddingProfileId && weddingProfileId !== 'undefined' && weddingProfileId !== 'null';

  if (!hasWeddingProfileId) {
    const globalProfile = await ensureVendorProductsWeddingProfile();
    data.weddingProfileId = globalProfile.id;
  } else {
    const wedding = await prisma.weddingProfile.findUnique({ where: { id: weddingProfileId } });
    if (!wedding) throw { status: 404, message: 'Wedding profile not found' };
  }

  return await prisma.giftItem.create({ data });
};


  const list = async ({
    weddingProfileId,
    status,
    cursor,
    limit = 20,
    user,
  }) => {
    const where = {
      weddingProfileId,
  };

  if (status) {
    where.status = status;
  }

  const gifts = await prisma.giftItem.findMany({
    where,
    include: {
      weddingProfile: true,
    },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    orderBy: {
      createdAt: 'desc',
    },
  });

  const filtered = [];

  for (const gift of gifts) {
    if (gift.privacy === 'PUBLIC') {
      filtered.push(gift);
      continue;
    }

    if (
      gift.privacy === 'PRIVATE' &&
      gift.weddingProfile.coupleId === user.id
    ) {
      filtered.push(gift);
      continue;
    }

    if (gift.privacy === 'FAMILY_ONLY') {
      const familyMember =
        await prisma.familyMember.findFirst({
          where: {
            weddingProfileId:
              gift.weddingProfileId,
            guestId: user.id,
          },
        });

      if (
        familyMember ||
        gift.weddingProfile.coupleId === user.id
      ) {
        filtered.push(gift);
      }
    }
  }

  let nextCursor = null;

  if (filtered.length > limit) {
    nextCursor = filtered[limit].id;
    filtered.pop();
  }

  return {
    data: filtered,
    nextCursor,
  };
};


const getById = async (id) => {
  const gift = await prisma.giftItem.findUnique({ where: { id } });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  return gift;
};

const update = async (id, data) => {
  const gift = await prisma.giftItem.findUnique({ where: { id } });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  return await prisma.giftItem.update({ where: { id }, data });
};

const remove = async (id) => {
  const gift = await prisma.giftItem.findUnique({ where: { id } });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  await prisma.giftItem.delete({ where: { id } });
};

module.exports = { create, list, getById, update, remove, getVendorProductsWeddingProfileId };