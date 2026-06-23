package me.insomniyuck.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(InstagramStoryPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
