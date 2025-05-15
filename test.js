const { database } = require('./database/database');


// This is the target account which will be used in the unit tests
// It needs one public and one private post to work
// Also cnage the notOwnedPostId to a post id of another uses post (to be used to make sure it is inaccesssable)
const duplicateAccount = {
    username: 'unit_test_account',
    email: 'cnn21xeu@uea.ac.uk',
    password: '9Q&53giQ&kQS',
    privatePostTitle: "unit_test",
    nonOwnedPostId: 38
}

async function testSignUp()
{
    let failedTests = [];
    console.log("Sign up tests:");
    // sign up with duplicate username
    console.log("   Test 1: Sign up with dulicate username:");
    const t1result = await database.user.signup(duplicateAccount.username, 'test', 'test', 'testing@test.com', '9Q&53giQ&kQS');
    if(t1result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(1);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }
    // sign up with compromised password snoopy
    console.log("   Test 2: Sign up with compramised password:")
    const t2result = await database.user.signup('unit_test_account', 'test', 'test', 'testing@test.com', 'snoopy');
    if(t2result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(2);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    console.log("   Test 3: Sign up with dulicate email:")
    const t3result = await database.user.signup('unit_test_account', 'test', 'test', duplicateAccount.email, '9Q&53giQ&kQS');
    if(t3result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(3);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    return failedTests;
}

async function testSignIn()
{
    let failedTests = [];
    console.log("Sign in up tests:");
    // login with incorrect username
    console.log("   Test 1: Sign in with incorrect username:");
    const t1result = await database.user.signin('e9sdufsjk', duplicateAccount.password);
    if(t1result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(1);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    // login with incorrect password
    console.log("   Test 2: Sign in with incorrect password:")
    const t2result = await database.user.signin(duplicateAccount.username, 'abcd');
    if(t2result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(2);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    return failedTests;
}

async function testInfoUpdate()
{
    let failedTests = [];
    console.log("User info update tests:");
    // update username with incorrect password
    console.log("   Test 1: Update username with incorrect password:");
    const t1result = await database.user.update(duplicateAccount.username, "username", "test", "fefs3o98%39");
    if(t1result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(1);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    // update username with duplicate username
    console.log("   Test 2: Update username with duplicate username:");
    const t2result = await database.user.update(duplicateAccount.username, "username", duplicateAccount.username, duplicateAccount.password);
    if(t2result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(2);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    // update password with incorect old password
    console.log("   Test 3: Update password with incorrect old password:");
    const t3result = await database.user.update(duplicateAccount.username, "password", "test", "85904380594");
    if(t3result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(3);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    // update password with compromised password

    console.log("   Test 4: Update password with compromised password:");
    const t4result = await database.user.update(duplicateAccount.username, "password", "snoopy", duplicateAccount.password);
    if(t4result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(4);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    // update email with incorrect password
    console.log("   Test 5: Update email with duplicate email:");
    const t5result = await database.user.update(duplicateAccount.username, "email", duplicateAccount.email, duplicateAccount.password);
    if(t5result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(5);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    return failedTests;
}

async function testPostsGet()
{
    let failedTests = [];
    console.log("Get posts tests:");
    // get public posts only returns public posts
    console.log("   Test 1: Get only public posts:");
    const t1result = await database.post.getPublicPosts()
    let t1Failed = false;
    for(post in t1result.posts)
    {
        if(post.title === duplicateAccount.privatePostTitle)
        {
            t1Failed = true;
        }
    }
    if(t1Failed === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(1);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    // get public and private posts only gets public and users own private posts
    console.log("   Test 2: Get private posts:");
    const t2result = await database.post.getPublicAndPrivatePosts(duplicateAccount.username)
    let t2Failed = false;
    for(post in t2result.posts)
    {
        if(post.title === duplicateAccount.privatePostTitle)
        {
            t2Failed = true;
        }
    }
    if(t1Failed === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(2);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    return failedTests;
}

async function testUpdatePost()
{
    let failedTests = [];
    console.log("Get post tests:");
    // get post which does not belong to user
    console.log("   Test 1: Get a post which does not belong to user:");
    const t1result = await database.post.getPost(duplicateAccount.username, duplicateAccount.nonOwnedPostId)
    if(t1result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(1);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }
    // update other users post
    console.log("   Test 2: Update a post which does not belong to user:");
    const t2result = await database.post.update(duplicateAccount.username, 'title', 'new title', duplicateAccount.nonOwnedPostId);
    if(t2result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(2);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }
    
    // delete other users post
    console.log("   Test 3: Delete a post which does not belong to user:");
    const t3result = await database.post.delete(duplicateAccount.username, duplicateAccount.nonOwnedPostId)
    if(t3result.success === true)
    {
        console.log('\x1b[31m%s\x1b[0m', "      Test Failed");
        failedTests.push(3);
    }
    else
    {
        console.log('\x1b[32m%s\x1b[0m', "      Test Passed");
    }

    return failedTests;
}

async function runAllTests()
{
    await database.testConnection();
    let signUpTestsFailed = await testSignUp()
    let signInTestsFailed = await testSignIn();
    let testInfoUpdateTestsFailed = await testInfoUpdate();
    let testPostGetTestsFailed = await testPostsGet();
    let testUpdatePostTestsFailed = await testUpdatePost();
    
    console.log('');
    console.log(" ##### Unit test summary #####");
    console.log("Sign Up:");
    if(signUpTestsFailed.length === 0)
    {
        console.log("   All tests passed");
    }
    else
    {
        console.log("   Following test numbers failed: ", signUpTestsFailed.toString());
    }

    console.log("Sign In:");
    if(signInTestsFailed.length === 0)
    {
        console.log("   All tests passed");
    }
    else
    {
        console.log("   Following test numbers failed: ", signInTestsFailed.toString());
    }

    console.log("User info update:");
    if(testInfoUpdateTestsFailed.length === 0)
    {
        console.log("   All tests passed");
    }
    else
    {
        console.log("   Following test numbers failed: ", testInfoUpdateTestsFailed.toString());
    }

    console.log("Post get:");
    if(testPostGetTestsFailed.length === 0)
    {
        console.log("   All tests passed");
    }
    else
    {
        console.log("   Following test numbers failed: ", testPostGetTestsFailed.toString());
    }

    console.log("Post update:");
    if(testUpdatePostTestsFailed.length === 0)
    {
        console.log("   All tests passed");
    }
    else
    {
        console.log("   Following test numbers failed: ", testUpdatePostTestsFailed.toString());
    }

    process.exit();
}

runAllTests();