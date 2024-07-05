import React, { useEffect } from 'react';
import styles from './UserTests.module.scss';
import { Navigate } from 'react-router-dom';
import useUserStore from '../../stores/userStore';
import Tests from '../../components/tests/Tests';

const UserTests = () => {
    const getTests = useUserStore(state => state.getUserTests);
    const tests = useUserStore(state => state.tests);
    const isLogged = useUserStore(state => state.isLogged);
    const user = useUserStore(state => state.user);
    const getUser = useUserStore(state => state.getUser);
    const isLoading = useUserStore(state => state.isLoading);

    useEffect(() => {
        if (isLogged && user) {
            getTests(user._id);
        } else {
            getUser();
        }
    }, [isLogged, user, getTests, getUser])

    return (
        <>{isLogged ?
            <div className={styles.main}>
                {tests ? <>
                    <h1>{user?.username}'s tests</h1>
                    <Tests tests={tests} />
                </> : <h1>{isLoading ? 'Loading...' : 'You haven\'t created any tests yet'}</h1>
                }
            </div> : <Navigate to={`/auth/login`} />}</>
    );
};

export default UserTests;