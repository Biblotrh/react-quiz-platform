import Test from './../models/testModel';
import User from './../models/userModel';

async function getUser(userId: string) {
    const userData = await User.findById(userId);
    if (!userData) {
        throw ({ status: 404, message: 'User not found' });
    }

    const { password, ...user } = userData.toObject();
    return user;
}

async function follow(userId: string, subscriberId: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw ({ status: 404, message: 'Subscriber not found' });
    }
    if (user._id === subscriber._id) {
        throw ({ status: 403, message: 'You can\'t follow yourself' });
    }
    if ((subscriber.followings as unknown[]).includes(userId)) {
        throw ({ status: 409, message: 'Already following' });
    }
    await User.findByIdAndUpdate(userId, { $set: { followers: [...user.followers, subscriber.id] } });
    await User.findByIdAndUpdate(subscriberId, { $set: { followings: [...subscriber.followings, user.id] } });
}

async function unfollow(userId: string, subscriberId: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw ({ status: 404, message: 'Subscriber not found' });
    }
    if (user._id === subscriber._id) {
        throw ({ status: 403, message: 'You can\'t follow yourself' });
    }
    if (!(subscriber.followings as unknown[]).includes(userId)) {
        throw ({ status: 409, message: 'Already unfollowed' });
    }
    await User.findByIdAndUpdate(userId, { $pull: { followers: subscriber.id } });
    await User.findByIdAndUpdate(subscriberId, { $pull: { followings: user.id } });
}

async function getUserPage(userId: string) {
    const userData = await User.findById(userId).populate({
        path: 'createdTests',
        populate: {
            path: 'author',
            select: ['username', 'avatarUrl']
        }
    }).populate({
        path: 'createdQuizzes',
        populate: {
            path: 'author',
            select: ['username', 'avatarUrl']
        }
    });
    if (!userData) {
        throw ({ status: 404, message: 'User not found' });
    }
    const { password, ...user } = userData.toObject();
    return user;
}

async function updateUser(userId: string, username: string, bio: string, showLikedPosts: boolean, showPassedTests: boolean) {
    const user = await User.findById(userId);
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    const checkUsername = User.findOne({ username });
    if (!checkUsername) {
        throw ({ status: 409, message: 'Username already exists' });
    }
    await User.findByIdAndUpdate(userId, { $set: { username, bio, showLikedPosts, showPassedTests } });
}

async function setAvatar(userId: string, avatarUrl: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    await User.findByIdAndUpdate(userId, { $set: { avatarUrl } });
}

async function getLikedPosts(userId: string) {
    const user = await User.findById(userId).populate({
        path: 'likedTests',
        populate: {
            path: 'author',
            select: ['username', 'avatarUrl']
        }
    });
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    return user.likedTests;
}

async function getPassedTests(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }

    const passedTests = [];
    for (let i = 0; i < user.passedTests.length; i++) {
        const test = await Test.findById(user.passedTests[i].testId).populate({
            path: 'author',
            select: ['username', 'avatarUrl']
        });
        if (!test) {
            throw { status: 404, message: 'Test not found' };
        }
        const finalResult = user.passedTests[i].result;
        passedTests[i] = { ...test.toObject(), finalResult };
    }
    return passedTests;
}

async function getSavedPosts(userId: string) {
    const user = await User.findById(userId).populate({
        path: 'savedTests',
        populate: {
            path: 'author',
            select: ['username', 'avatarUrl']
        }
    });
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    return user.savedTests;
}

async function getFollowers(userId: string) {
    const user = await User.findById(userId).populate('followers', ['username', 'avatarUrl']);
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    return user.followers;
}

async function getFollowings(userId: string) {
    const user = await User.findById(userId).populate('followings', ['username', 'avatarUrl']);
    if (!user) {
        throw ({ status: 404, message: 'User not found' });
    }
    return user.followings;
}


export const userService = {
    getUser,
    follow,
    unfollow,
    getUserPage,
    updateUser,
    setAvatar,
    getLikedPosts,
    getSavedPosts,
    getPassedTests,
    getFollowers,
    getFollowings,
};