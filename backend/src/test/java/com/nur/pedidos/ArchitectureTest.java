package com.nur.pedidos;

import static com.tngtech.archunit.base.DescribedPredicate.alwaysTrue;
import static com.tngtech.archunit.base.DescribedPredicate.not;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Entity;
import org.springframework.data.repository.Repository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

@AnalyzeClasses(packages = "com.nur.pedidos", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    private static final String ROOT = "com.nur.pedidos..";
    private static final String SHARED = "com.nur.pedidos.shared..";

    @ArchTest
    static final ArchRule domainIsFrameworkFree = noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "jakarta.persistence..", "org.hibernate..", "tools.jackson..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule domainDoesNotDependOnOuterLayers = noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..application..", "..infrastructure..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule applicationDoesNotDependOnInfrastructure = noClasses()
            .that()
            .resideInAPackage("..application..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..infrastructure..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule infrastructureIsPrivateToItsModule = slices().matching("com.nur.pedidos.(*).infrastructure..")
            .should()
            .notDependOnEachOther()
            .ignoreDependency(alwaysTrue(), resideInAPackage(SHARED))
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule sharedDoesNotDependOnModules = noClasses()
            .that()
            .resideInAPackage(SHARED)
            .should()
            .dependOnClassesThat(resideInAPackage(ROOT).and(not(resideInAPackage(SHARED))))
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule useCasesAreNamedAfterTheAction = classes()
            .that()
            .resideInAPackage("..application..")
            .and()
            .areAnnotatedWith(Service.class)
            .should()
            .haveSimpleNameEndingWith("UseCase")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule entitiesLiveInPersistence = classes()
            .that()
            .areAnnotatedWith(Entity.class)
            .should()
            .resideInAPackage("..infrastructure.persistence..")
            .andShould()
            .haveSimpleNameEndingWith("Entity")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule springDataRepositoriesLiveInPersistence = classes()
            .that()
            .areAssignableTo(Repository.class)
            .should()
            .resideInAPackage("..infrastructure.persistence..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule controllersLiveInWeb = classes()
            .that()
            .areAnnotatedWith(RestController.class)
            .should()
            .resideInAPackage("..infrastructure.web..")
            .andShould()
            .haveSimpleNameEndingWith("Controller")
            .allowEmptyShould(true);
}
