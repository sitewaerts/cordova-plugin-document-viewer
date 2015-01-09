/*
The MIT License (MIT)

Copyright 2014 sitewaerts GmbH. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

package de.sitewaerts.cordova.documentviewer;

import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
//import android.support.v4.content.FileProvider;
import android.util.Log;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public final class DocumentViewerPlugin
        extends CordovaPlugin
{

    private static final String TAG = "DocumentViewerPlugin";

    public static final class Actions
    {

        public static final String GET_SUPPORT_INFO = "getSupportInfo";

        public static final String CAN_VIEW = "canViewDocument";

        public static final String VIEW_DOCUMENT = "viewDocument";

        public static final String INSTALL_VIEWER_APP = "install";

    }

    public static final class Args
    {
        public static final String URL = "url";

        public static final String CONTENT_TYPE = "contentType";

        public static final String OPTIONS = "options";
    }

    public static final String ANDROID_OPTIONS = "android";
    public static final String DOCUMENTVIEW_OPTIONS = "documentView";
    public static final String NAVIGATIONVIEW_OPTIONS = "navigationView";
    public static final String EMAIL_OPTIONS = "email";
    public static final String PRINT_OPTIONS = "print";
    public static final String OPENWITH_OPTIONS = "openWith";
    public static final String BOOKMARKS_OPTIONS = "bookmarks";
    public static final String SEARCH_OPTIONS = "search";
    public static final String TITLE_OPTIONS = "title";

    public static final class Options
    {
        public static final String VIEWER_APP_PACKAGE_ID = "viewerAppPackage";

        public static final String VIEWER_APP_ACTIVITY = "viewerAppActivity";

        public static final String CLOSE_LABEL = "closeLabel";

        public static final String ENABLED = "enabled";
    }

    public static final String PDF = "application/pdf";

    public static final class Result
    {
        public static final String SUPPORTED = "supported";

        public static final String STATUS = "status";

        public static final String MESSAGE = "message";

        public static final String MISSING_APP_ID = "missingAppId";
    }

    private static final int REQUEST_CODE_OPEN = 1000;

    private static final int REQUEST_CODE_INSTALL = 1001;

    private CallbackContext callbackContext;


    public void initialize(CordovaInterface cordova, CordovaWebView webView)
    {
        super.initialize(cordova, webView);
        clearTempFiles();
    }

    public void onDestroy()
    {
        clearTempFiles();
        super.onDestroy();
    }

    public void onReset()
    {
        clearTempFiles();
        super.onReset();
    }

    /**
     * Executes the request and returns a boolean.
     *
     * @param action          The action to execute.
     * @param argsArray       JSONArray of arguments for the plugin.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return boolean.
     */
    public boolean execute(String action, JSONArray argsArray, CallbackContext callbackContext)
            throws JSONException
    {
        JSONObject args;
        JSONObject options;
        if (argsArray.length() > 0)
        {
            args = argsArray.getJSONObject(0);
            options = args.getJSONObject(Args.OPTIONS);
        }
        else
        {
            //no arguments passed, initialize with empty JSON Objects
            args = new JSONObject();
            options = new JSONObject();
        }

        if (action.equals(Actions.VIEW_DOCUMENT))
        {
            String url = args.getString(Args.URL);
            String contentType = args.getString(Args.CONTENT_TYPE);

            JSONObject androidOptions = options.getJSONObject(ANDROID_OPTIONS);

            String packageId = androidOptions.getString(
                    Options.VIEWER_APP_PACKAGE_ID
            );
            String activity = androidOptions.getString(
                    Options.VIEWER_APP_ACTIVITY
            );
            //put cordova arguments into Android Bundle in order to pass them to the external Activity
            Bundle viewerOptions = new Bundle();
            //exec
            viewerOptions
                    .putString(DOCUMENTVIEW_OPTIONS + "." + Options.CLOSE_LABEL,
                            options.getJSONObject(DOCUMENTVIEW_OPTIONS)
                                    .getString(Options.CLOSE_LABEL)
                    );
            viewerOptions.putString(
                    NAVIGATIONVIEW_OPTIONS + "." + Options.CLOSE_LABEL,
                    options.getJSONObject(NAVIGATIONVIEW_OPTIONS)
                            .getString(Options.CLOSE_LABEL)
            );
            viewerOptions.putBoolean(EMAIL_OPTIONS + "." + Options.ENABLED,
                    options.getJSONObject(EMAIL_OPTIONS)
                            .getBoolean(Options.ENABLED)
            );
            viewerOptions.putBoolean(PRINT_OPTIONS + "." + Options.ENABLED,
                    options.getJSONObject(PRINT_OPTIONS)
                            .getBoolean(Options.ENABLED)
            );
            viewerOptions.putBoolean(OPENWITH_OPTIONS + "." + Options.ENABLED,
                    options.getJSONObject(OPENWITH_OPTIONS)
                            .getBoolean(Options.ENABLED)
            );
            viewerOptions.putBoolean(BOOKMARKS_OPTIONS + "." + Options.ENABLED,
                    options.getJSONObject(BOOKMARKS_OPTIONS)
                            .getBoolean(Options.ENABLED)
            );
            viewerOptions.putBoolean(SEARCH_OPTIONS + "." + Options.ENABLED,
                    options.getJSONObject(SEARCH_OPTIONS)
                            .getBoolean(Options.ENABLED)
            );
            viewerOptions
                    .putString(TITLE_OPTIONS, options.getString(TITLE_OPTIONS));

            this._open(url, contentType, packageId, activity,
                    callbackContext,
                    viewerOptions
            );
        }
        else if (action.equals(Actions.INSTALL_VIEWER_APP))
        {
            String packageId = options.getJSONObject(ANDROID_OPTIONS).getString(
                    Options.VIEWER_APP_PACKAGE_ID
            );

            this._install(packageId, callbackContext);
        }
        else if (action.equals(Actions.CAN_VIEW))
        {
            String url = args.getString(Args.URL);

            String contentType = args.getString(Args.CONTENT_TYPE);

            JSONObject androidOptions = options.getJSONObject(ANDROID_OPTIONS);

            String packageId = androidOptions.getString(
                    Options.VIEWER_APP_PACKAGE_ID
            );

            JSONObject successObj = null;
            if (PDF.equals(contentType))
            {
                if (canGetFile(url))
                {
                    if (!this._appIsInstalled(packageId))
                    {
                        successObj = new JSONObject();
                        successObj.put(Result.STATUS,
                                PluginResult.Status.NO_RESULT.ordinal()
                        );
                        successObj.put(Result.MISSING_APP_ID, packageId);
                    }
                    else
                    {
                        successObj = new JSONObject();
                        successObj.put(Result.STATUS,
                                PluginResult.Status.OK.ordinal()
                        );
                    }
                }
                else
                {
                    Log.d(TAG, "File " + url + " not available");
                }
            }

            if (successObj == null)
            {
                successObj = new JSONObject();
                successObj.put(Result.STATUS,
                        PluginResult.Status.NO_RESULT.ordinal()
                );
            }

            callbackContext.success(successObj);
        }
        else if (action.equals(Actions.GET_SUPPORT_INFO))
        {
            JSONObject successObj = new JSONObject();
            JSONArray supported = new JSONArray();
            supported.put(PDF);
            successObj.put(Result.SUPPORTED, supported);
            callbackContext.success(successObj);
        }
        else
        {
            JSONObject errorObj = new JSONObject();
            errorObj.put(Result.STATUS,
                    PluginResult.Status.INVALID_ACTION.ordinal()
            );
            errorObj.put(Result.MESSAGE, "Invalid action '" + action + "'");
            callbackContext.error(errorObj);
        }
        return true;
    }


    /**
     * Called when a previously started Activity ends
     *
     * @param requestCode The request code originally supplied to startActivityForResult(),
     *                    allowing you to identify who this result came from.
     * @param resultCode  The integer result code returned by the child activity through its setResult().
     * @param intent      An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
     */
    public void onActivityResult(int requestCode, int resultCode, Intent intent)
    {
        if(this.callbackContext == null)
            return;

        if (requestCode == REQUEST_CODE_OPEN)
        {
            //remove tmp file
            clearTempFiles();
            try
            {
                // send closed event
                JSONObject successObj = new JSONObject();
                successObj.put(Result.STATUS,
                        PluginResult.Status.NO_RESULT.ordinal()
                );
                this.callbackContext.success(successObj);
            }
            catch (JSONException e)
            {
                e.printStackTrace();
            }
            this.callbackContext = null;
        }
        else if (requestCode == REQUEST_CODE_INSTALL)
        {
            // send success event
            this.callbackContext.success();
            this.callbackContext = null;
        }
    }

    private void _open(String url, String contentType, String packageId, String activity, CallbackContext callbackContext, Bundle viewerOptions)
            throws JSONException
    {
        clearTempFiles();

        File file = getAccessibleFile(url);

        if (file!=null && file.exists() && file.isFile())
        {
            try
            {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                Uri path = Uri.fromFile(file);

                // @see http://stackoverflow.com/questions/2780102/open-another-application-from-your-own-intent
                intent.addCategory(Intent.CATEGORY_EMBED);
                intent.setDataAndType(path, contentType);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                intent.putExtra(this.getClass().getName(), viewerOptions);
                //activity needs fully qualified name here
                intent.setComponent(
                        new ComponentName(packageId, packageId + "." + activity)
                );

                this.callbackContext = callbackContext;
                this.cordova.startActivityForResult(this, intent,
                        REQUEST_CODE_OPEN
                );

                // send shown event
                JSONObject successObj = new JSONObject();
                successObj.put(Result.STATUS, PluginResult.Status.OK.ordinal());
                PluginResult result = new PluginResult(PluginResult.Status.OK,
                        successObj
                );
                // need to keep callback for close event
                result.setKeepCallback(true);
                callbackContext.sendPluginResult(result);
            }
            catch (android.content.ActivityNotFoundException e)
            {
                JSONObject errorObj = new JSONObject();
                errorObj.put(Result.STATUS, PluginResult.Status.ERROR.ordinal()
                );
                errorObj.put(Result.MESSAGE,
                        "Activity not found: " + e.getMessage()
                );
                callbackContext.error(errorObj);
            }
        }
        else
        {
            JSONObject errorObj = new JSONObject();
            errorObj.put(Result.STATUS, PluginResult.Status.ERROR.ordinal());
            errorObj.put(Result.MESSAGE, "File not found");
            callbackContext.error(errorObj);
        }
    }

    private void copyFile(File src, File target)
            throws IOException
    {
//        Log.d(TAG, "Creating temp file for " + src.getAbsolutePath()
//                + " at " + target.getAbsolutePath());
        copyFile(new FileInputStream(src), target);
    }

    private void copyFile(InputStream in, File target)
            throws IOException
    {
        OutputStream out = null;
        //create tmp folder if not present
        if (!target.getParentFile().exists() && !target.getParentFile()
                .mkdirs())
            throw new IOException("Cannot create path " + target.getParentFile()
                    .getAbsolutePath()
            );
        try
        {
            out = new FileOutputStream(target);
            byte[] buffer = new byte[1024];
            int read;
            while ((read = in.read(buffer)) != -1)
                out.write(buffer, 0, read);
        }
        catch (IOException e)
        {
            Log.e(TAG, "Failed to copy stream to "
                    + target.getAbsolutePath(), e
            );
        }
        finally
        {
            if (in != null)
            {
                try
                {
                    in.close();
                }
                catch (IOException e)
                {
                    // NOOP
                }
            }
            if (out != null)
            {
                try
                {
                    out.close();
                }
                catch (IOException e)
                {
                    // NOOP
                }
            }
        }

    }

    private int tempCounter = 0;

    private File getSharedTempFile(String name)
    {
        return new File(getSharedTempDir(), (tempCounter++) + "." + name);
    }

    private File getSharedTempDir()
    {
        return new File(
                new File(cordova.getActivity().getExternalFilesDir(null), "tmp"
                ), TAG
        );
    }

    private void clearTempFiles()
    {
        File dir = getSharedTempDir();
        if (!dir.exists())
            return;

        //Log.d(TAG, "clearing temp files below " + dir.getAbsolutePath());
        deleteRecursive(dir, false);
    }

    private void deleteRecursive(File f, boolean self)
    {
        if (!f.exists())
            return;

        if(f.isDirectory())
        {
            File[] files = f.listFiles();
            for (File file : files)
                deleteRecursive(file, true);
        }

        if (self && !f.delete())
            Log.e(TAG, "Failed to delete file " + f.getAbsoluteFile());

    }

    private static final String ASSETS = "file:///android_asset/";

    private boolean canGetFile(String fileArg)
            throws JSONException
    {
        return fileArg.startsWith(ASSETS) || getFile(fileArg).exists();
    }

    private File getAccessibleFile(String fileArg)
            throws JSONException
    {
        if (fileArg.startsWith(ASSETS))
        {
            String filePath = fileArg.substring(ASSETS.length());
            String fileName = filePath.substring(
                    filePath.lastIndexOf(File.pathSeparator) + 1);

            //Log.d(TAG, "Handling assets file: fileArg: " + fileArg + ", filePath: " + filePath + ", fileName: " + fileName);

            try
            {
                File tmpFile = getSharedTempFile(fileName);
                InputStream in;
                try
                {
                    in = this.cordova.getActivity().getAssets().open(filePath);
                    if (in == null)
                        return null;
                }
                catch (IOException e)
                {
                    // not found
                    return null;
                }
                copyFile(in, tmpFile);
                tmpFile.deleteOnExit();
                return tmpFile;
            }
            catch (IOException e)
            {
                Log.e(TAG, "Failed to copy file: " + filePath, e);
                JSONException je = new JSONException(e.getMessage());
                je.initCause(e);
                throw je;
            }
        }
        else
        {
            File file = getFile(fileArg);
            if (!file.exists() || !file.isFile())
                return null;

            // detect private files, copy to accessible tmp dir if necessary
            // XXX does this condition cover all cases?
            if (file.getAbsolutePath().contains(
                    cordova.getActivity().getFilesDir().getAbsolutePath()
            ))
            {
//            		XXX this is the "official" way to share private files with other apps: with a content:// URI. Unfortunately, MuPDF does not swallow the generated URI. :(
//            		path = FileProvider.getUriForFile(cordova.getActivity(), "de.sitewaerts.cordova.fileprovider", file);
//            		cordova.getActivity().grantUriPermission(packageId, path, Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
//            		intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

                try
                {
                    File tmpFile = getSharedTempFile(file.getName());
                    copyFile(file, tmpFile);
                    tmpFile.deleteOnExit();
                    return tmpFile;
                }
                catch (IOException e)
                {
                    Log.e(TAG, "Failed to copy file: " + file.getName(), e);
                    JSONException je = new JSONException(e.getMessage());
                    je.initCause(e);
                    throw je;
                }
            }

            return file;
        }
    }


    private File getFile(String fileArg)
            throws JSONException
    {
        String filePath;
        try
        {
            CordovaResourceApi resourceApi = webView.getResourceApi();
            Uri fileUri = resourceApi.remapUri(Uri.parse(fileArg));
            filePath = this.stripFileProtocol(fileUri.toString());
        }
        catch (Exception e)
        {
            filePath = fileArg;
        }
        return new File(filePath);
    }

    private void _install(String packageId, CallbackContext callbackContext)
            throws JSONException
    {
        if (!this._appIsInstalled(packageId))
        {
            this.callbackContext = callbackContext;

            try {
                Intent intent = new Intent(Intent.ACTION_VIEW,
                        Uri.parse("market://details?id=" + packageId));
                this.cordova.startActivityForResult(this, intent,
                        REQUEST_CODE_INSTALL
                );
            } catch (android.content.ActivityNotFoundException e) {
                Intent intent = new Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://play.google.com/store/apps/details?id=" + packageId));
                this.cordova.startActivityForResult(this, intent,
                        REQUEST_CODE_INSTALL
                );
            }
        }
        else
        {
            JSONObject errorObj = new JSONObject();
            errorObj.put(Result.STATUS, PluginResult.Status.ERROR.ordinal());
            errorObj.put(Result.MESSAGE,
                    "Package " + packageId + " already installed"
            );
            callbackContext.error(errorObj);
        }
    }

    private boolean _appIsInstalled(String packageId)
    {
        PackageManager pm = cordova.getActivity().getPackageManager();
        try
        {
            pm.getPackageInfo(packageId, PackageManager.GET_ACTIVITIES);
            return true;
        }
        catch (PackageManager.NameNotFoundException e)
        {
            return false;
        }
    }

    private String stripFileProtocol(String uriString)
    {
        if (uriString.startsWith("file://"))
            uriString = uriString.substring(7);
        return uriString;
    }

}
