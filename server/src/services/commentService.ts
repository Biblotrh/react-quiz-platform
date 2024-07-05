import Comment from './../models/commentModel';
import Answer from './../models/answerModel';
import User from './../models/userModel';
import Test from './../models/testModel';

async function createComment(comment: string, userId: string, testId: string) {
    const test = await Test.findById(testId);
    if (!test) {
        throw new Error('Test not found');
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const comm = new Comment({ comment, author: userId, test: testId });
    await comm.save();
    await Test.findByIdAndUpdate(testId, { $set: { comments: [...test.comments, comm._id] } });
    await User.findByIdAndUpdate(userId, { $set: { comments: [...user.comments, comm._id] } });
    return await comm.populate('author', 'username');
}

async function updateComment(commentId: string, testId: string, userId: string, newComment: string) {
    const user = await User.findById(userId);
    if (!user || String(user._id) !== userId) {
        throw new Error('User not found');
    }
    const test = await Test.findById(testId);
    if (!test) {
        throw new Error('Test not found');
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new Error('Comment not found');
    }
    if (String(comment.author) !== userId) {
        throw new Error('Access denied');
    }
    await Comment.findByIdAndUpdate(commentId, { $set: { comment: newComment } });
    const updatedComment = await Comment.findById(commentId).populate('author', 'username');
    return updatedComment;
}

async function removeComment(commentId: string, userId: string, testId: string) {
    const test = await Test.findById(testId);
    if (!test) {
        throw new Error('Test not found');
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new Error('Comment not found');
    }
    if (String(comment.author) !== userId) {
        throw new Error('Access denied');
    }
    if (comment.answers.length) {
        comment.answers.map(async (answerId) => {
            const answer = await Answer.findById(answerId);
            if (answer) {
                await User.findByIdAndUpdate(answer?.author, { $pull: { answers: answer._id } })
                await answer?.deleteOne();
            }
        });
    }

    await Test.findByIdAndUpdate(comment.test, { $pull: { comments: comment._id } });
    await User.findByIdAndUpdate(comment.author, { $pull: { comments: comment._id } });
    await Comment.findByIdAndDelete(commentId);
}

async function likeComment(commentId: string, userId: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new Error('Comment not found');
    }
    if ((user.likedComments as unknown[]).includes(commentId)) {
        await comment.updateOne({ $set: { likes: --comment.likes } })
        await user.updateOne({ $pull: { likedComments: commentId } });
    } else {
        await comment.updateOne({ $set: { likes: ++comment.likes } })
        await user.updateOne({ $set: { likedComments: [...user.likedComments, commentId] } });
    }
}

async function getComments(testId: string) {
    const test = await Test.findById(testId).populate({
        path: 'comments',
        populate: [
            {
                path: 'author',
                model: 'User',
                select: 'username'
            }
        ]
    });

    if (!test) {
        throw new Error('Test not found');
    }
    return test.comments;
}

async function createAnswer(answer: string, userId: string, testId: string, parentId: string) {
    const test = await Test.findById(testId);
    if (!test) {
        throw new Error('Test not found');
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const comment = await Comment.findById(parentId);
    if (!comment) {
        throw new Error('Comment not found');
    }
    const answ = new Answer({ comment: answer, author: userId, test: testId, parentComment: parentId });
    await answ.save();
    await Test.findByIdAndUpdate(testId, { $set: { commentAnswers: [...test.commentAnswers, answ._id] } });
    await User.findByIdAndUpdate(userId, { $set: { answers: [...user.comments, answ._id] } });
    await Comment.findByIdAndUpdate(parentId, { $set: { answers: [...comment.answers, answ._id] } });
    return answ;
}

async function updateAnswer(answerId: string, userId: string, newComment: string) {
    const user = await User.findById(userId);
    if (!user || String(user._id) !== userId) {
        throw new Error('User not found');
    }
    const answer = await Answer.findById(answerId);
    if (!answer) {
        throw new Error('Comment not found');
    }
    if (String(answer.author) !== userId) {
        throw new Error('Access denied');
    }
    await Answer.findByIdAndUpdate(answerId, { $set: { comment: newComment } });
    const updatedAnswer = await Answer.findById(answerId).populate('author', 'username');
    return updatedAnswer;
}

async function removeAnswer(parentId: string, answerId: string, userId: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const answer = await Answer.findById(answerId);
    if (!answer) {
        throw new Error('Comment not found');
    }
    if (String(answer.author) !== userId) {
        throw new Error('Access denied');
    }

    await Comment.findByIdAndUpdate(answer.parentComment, { $pull: { answers: answer._id } });
    await User.findByIdAndUpdate(userId, { $pull: { answers: answer._id } });
    await Test.findByIdAndUpdate(answer.test, { $pull: { commentAnswers: answer._id } });
    await Answer.findByIdAndDelete(answerId);
}

async function likeAnswer(answerId: string, userId: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const answer = await Answer.findById(answerId);
    if (!answer) {
        throw new Error('Comment not found');
    }
    if ((user.likedAnswers as unknown[]).includes(answerId)) {
        await answer.updateOne({ $set: { likes: --answer.likes } })
        await user.updateOne({ $pull: { likedAnswers: answerId } });
    } else {
        await answer.updateOne({ $set: { likes: ++answer.likes } })
        await user.updateOne({ $set: { likedAnswers: [...user.likedComments, answerId] } });
    }
}

async function getAnswers(commentId: string) {
    const comment = await Comment.findById(commentId).populate({
        path: 'answers',
        populate: [
            {
                path: 'author',
                model: 'User',
                select: 'username'
            }
        ]
    });
    if (!comment) {
        throw new Error('Test not found');
    }
    return comment.answers;
}

export const commentService = {
    createComment,
    updateComment,
    removeComment,
    createAnswer,
    getComments,
    getAnswers,
    updateAnswer,
    removeAnswer,
    likeComment,
    likeAnswer
};