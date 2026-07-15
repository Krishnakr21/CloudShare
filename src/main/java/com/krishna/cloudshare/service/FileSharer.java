package com.krishna.cloudshare.service;

import com.krishna.cloudshare.utils.UploadUtils;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.HashMap;

public class FileSharer {

    private HashMap<Integer, String> availableFiles;

    public FileSharer() {
        availableFiles = new HashMap<>();
    }

    public int offerFile(String filePath) {
        int port;
        while (true) {
            port = UploadUtils.generateCode();
            if (!availableFiles.containsKey(port)) {
                availableFiles.put(port, filePath);
                return port;
            }
        }
    }

    public String getFilePath(int port) {
        return availableFiles.get(port);
    }

    public void startFileServer(int port) {
        // Dynamic TCP socket loopback bypassed for container hosting compatibility
    }
}
