<?php

namespace modules;

use Craft;
use craft\events\RegisterTemplateRootsEvent;
use craft\web\View;
use modules\cp\BildformateUtility;
use modules\twig\WordBreakExtension;
use yii\base\Event;
use yii\base\Module;

/**
 * Projektmodul.
 *
 * Sammelstelle für alles, was Craft auf PHP-Ebene erweitert: Twig-Erweiterungen,
 * CP-Seiten, die Utility „Bildformate“ samt Controller unter `controllers/`.
 * Weiteres kommt hier daneben, statt je ein eigenes Modul zu bekommen.
 *
 * Eingetragen in `config/app.php` unter `modules` und `bootstrap` — nur der
 * Bootstrap-Eintrag sorgt dafür, dass `init()` bei jedem Aufruf läuft und die
 * Erweiterung überhaupt registriert wird.
 */
class Modul extends Module
{
    /** Template-Root für die CP-Templates unter `modules/templates`. */
    public const TEMPLATE_ROOT = 'modul';

    public function init(): void
    {
        // Ohne diesen Alias löst Yii `@modules/controllers` nicht auf und
        // `craft help` bricht ab.
        Craft::setAlias('@modules', __DIR__);

        // Web- und Konsolen-Controller liegen getrennt; Yii sucht sie nur in einem Namespace.
        if (Craft::$app->getRequest()->getIsConsoleRequest()) {
            $this->controllerNamespace = 'modules\\console\\controllers';
        }

        parent::init();

        Craft::$app->getView()->registerTwigExtension(new WordBreakExtension());

        // Module bringen anders als Plugins keinen Template-Root mit; die CP-Seiten
        // und Werkzeuge rendern daraus.
        Event::on(
            View::class,
            View::EVENT_REGISTER_CP_TEMPLATE_ROOTS,
            function(RegisterTemplateRootsEvent $event) {
                $event->roots[self::TEMPLATE_ROOT] = __DIR__ . '/templates';
            }
        );

        BildformateUtility::registrieren();
    }
}
