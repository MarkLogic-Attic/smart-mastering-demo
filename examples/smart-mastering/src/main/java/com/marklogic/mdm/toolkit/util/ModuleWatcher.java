package com.marklogic.mdm.toolkit.util;

import java.io.File;

import org.springframework.scheduling.annotation.Scheduled;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.ext.helper.LoggingObject;
import com.marklogic.client.ext.modulesloader.ModulesFinder;
import com.marklogic.client.ext.modulesloader.impl.DefaultModulesFinder;
import com.marklogic.client.ext.modulesloader.impl.DefaultModulesLoader;
import com.marklogic.client.ext.modulesloader.impl.AssetFileLoader;

/**
 * Loads new/modified modules from src/main/ml-modules. Only intended to run in a dev profile. It means you can run
 * "gradle bootRun", and the equivalent of "gradle mlWatch" will run as well.
 */
public class ModuleWatcher extends LoggingObject {

    private DatabaseClient contentDatabaseClient;
    private DatabaseClient modulesDatabaseClient;
    private DefaultModulesLoader loader;

    private String modulesPath = "src/main/ml-modules";
    private ModulesFinder modulesFinder = new DefaultModulesFinder();

    public ModuleWatcher(DatabaseClient contentDatabaseClient, DatabaseClient modulesDatabaseClient) {
        this.contentDatabaseClient = contentDatabaseClient;
        this.modulesDatabaseClient = modulesDatabaseClient;
        this.loader = new DefaultModulesLoader();
        this.loader.setCatchExceptions(true);
        if (logger.isInfoEnabled()) {
            logger.info("Initialized");
        }
    }

    /**
     * RestApiAssetLoader isn't thread-safe, so a new instance is created on each invocation.
     */
    @Scheduled(fixedDelay = 2000)
    public void checkForModulesToLoad() {
        loader.setAssetFileLoader(new AssetFileLoader(modulesDatabaseClient));
        loader.loadModules(modulesPath, modulesFinder, contentDatabaseClient);
    }

    public void setModulesPath(String modulesPath) {
        this.modulesPath = modulesPath;
    }

    public void setModulesFinder(ModulesFinder modulesFinder) {
        this.modulesFinder = modulesFinder;
    }
}
