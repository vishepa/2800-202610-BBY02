defualt function LoginSignupPopup() {
    return (
        <div>
            <h1>Login/Signup Popup</h1>
            <form>
                <label>Username:
                    <input type="text" name="username" />
                </label>
                <br />
                <label>
                    Password:
                    <input type="password" name="password" />
                </label>
                <br />
                <button type="submit">Login</button>
                <button type="button">Signup</button>
            </form>
        </div>
    );
}