<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class SessionController extends Controller
{
    //----------------------------
     //Handle admin login.
    //----------------------------
    public function store(Request $request)
    {
        // Validate the login data sent by the user.
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Attempt to authenticate the user using the provided credentials.
        if (! Auth::attempt($credentials)) {
            // Return a validation error if the email or password is incorrect.
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Regenerate the session ID after successful authentication
        // to prevent session fixation attacks.
        $request->session()->regenerate();

        // Make sure the authenticated user is an active administrator.
        if (! $request->user()->is_admin || ! $request->user()->is_active) {
            // Log out the user if they are not authorized to access the admin panel.
            Auth::logout();

            // Return an authorization error.
            throw ValidationException::withMessages([
                'email' => ['You are not authorized to access the admin panel.'],
            ]);
        }

        // Return a successful login response.
        return response()->json([
            'message' => 'Login successful.',
        ]);
    }

    //-----------------------
     // Handle admin logout.
     //----------------------
    public function destroy(Request $request)
    {
        // Log out the currently authenticated user.
        Auth::logout();

        // Invalidate the current session.
        $request->session()->invalidate();

        // Generate a new CSRF token for the next session.
        $request->session()->regenerateToken();

        // Return a successful logout response.
        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    //-----------------------------------------
    // Return the currently authenticated user.
    //----------------------------------------
    public function me(Request $request)
    {
        // Return the authenticated user's information.
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}

