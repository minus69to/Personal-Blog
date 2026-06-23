package me.insomniyuck.app;

import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "InstagramStory")
public class InstagramStoryPlugin extends Plugin {
    private static final String INSTAGRAM_PACKAGE = "com.instagram.android";
    private static final String STORY_ACTION = "com.instagram.share.ADD_TO_STORY";

    @PluginMethod
    public void share(PluginCall call) {
        String imageData = call.getString("imageData");
        String contentUrl = call.getString("contentUrl");

        if (imageData == null || imageData.isEmpty()) {
            call.reject("The story image is missing", "IMAGE_MISSING");
            return;
        }
        if (contentUrl == null || !contentUrl.startsWith("https://")) {
            call.reject("A secure post URL is required", "URL_INVALID");
            return;
        }

        try {
            byte[] imageBytes = Base64.decode(imageData, Base64.DEFAULT);
            File storyDirectory = new File(getContext().getCacheDir(), "shared-stories");
            if (!storyDirectory.exists() && !storyDirectory.mkdirs()) {
                call.reject("Unable to prepare the story image", "CACHE_UNAVAILABLE");
                return;
            }

            File storyFile = new File(storyDirectory, "insomniyuck-story.png");
            try (FileOutputStream output = new FileOutputStream(storyFile, false)) {
                output.write(imageBytes);
            }

            Uri storyUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                storyFile
            );

            Intent storyIntent = new Intent(STORY_ACTION);
            storyIntent.setPackage(INSTAGRAM_PACKAGE);
            storyIntent.setDataAndType(storyUri, "image/png");
            storyIntent.setClipData(ClipData.newRawUri("Insomniyuck story", storyUri));
            storyIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            storyIntent.putExtra("com.instagram.sharedSticker.contentURL", contentUrl);
            storyIntent.putExtra("content_url", contentUrl);

            if (!BuildConfig.META_APP_ID.isEmpty()) {
                storyIntent.putExtra("source_application", BuildConfig.META_APP_ID);
            }

            getContext().grantUriPermission(
                INSTAGRAM_PACKAGE,
                storyUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            getActivity().runOnUiThread(() -> {
                try {
                    getActivity().startActivity(storyIntent);
                    JSObject result = new JSObject();
                    result.put("opened", true);
                    result.put("attributionConfigured", !BuildConfig.META_APP_ID.isEmpty());
                    call.resolve(result);
                } catch (ActivityNotFoundException error) {
                    call.reject("Instagram is not installed", "INSTAGRAM_UNAVAILABLE", error);
                }
            });
        } catch (IllegalArgumentException error) {
            call.reject("The story image is invalid", "IMAGE_INVALID", error);
        } catch (IOException error) {
            call.reject("Unable to prepare the story image", "WRITE_FAILED", error);
        }
    }
}
