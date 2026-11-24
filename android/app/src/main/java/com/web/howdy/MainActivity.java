package com.web.howdy;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.support.constraint.ConstraintLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.Toast;


public class MainActivity extends AppCompatActivity {
    public static final String BASE_URL = BuildConfig.HOWDY_BASE_URL;

    ConstraintLayout motionLayout;
    Window window;

    ImageView whiteLogo;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //CODING IN EVERY ACTIVITY
        ActionBar actionBar = getSupportActionBar();

        if(actionBar != null)
            actionBar.hide();

        setContentView(R.layout.activity_main);

        motionLayout = findViewById(R.id.motionLayout);

        whiteLogo = findViewById(R.id.whiteLogo);

        SharedPreferences sharedPreferences = getSharedPreferences("LOGGED_USER", Context.MODE_PRIVATE);

        boolean day = sharedPreferences.getBoolean("day", true);

        window = getWindow();

        if(day) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#000000"));
        } else
            applyDarkTheme();

        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                if(android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                    Toast.makeText(MainActivity.this, "howdy? is compatible with Android 5.0 Lollipop or higher", Toast.LENGTH_LONG).show();

                    new Handler().postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            finish();
                            System.exit(0);
                        }
                    }, 2000);
                } else {
                    boolean auth_2FA = sharedPreferences.getBoolean("auth_2FA", false);

                    if(auth_2FA)
                        startActivity(new Intent(MainActivity.this, AuthActivity.class));
                    else
                        startActivity(new Intent(MainActivity.this, LoginActivity.class));

                    overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left);
                    finish();
                }
            }
        }, 2000);
    }

    public void applyDarkTheme() {
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#333333"));

        motionLayout.setBackgroundColor(Color.parseColor("#000000"));
        whiteLogo.setImageTintList(ColorStateList.valueOf(Color.parseColor("#000000")));
    }

}
