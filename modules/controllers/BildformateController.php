<?php

namespace modules\controllers;

use craft\elements\Entry;
use craft\helpers\Queue;
use craft\queue\jobs\ResaveElements;
use craft\web\Controller;
use modules\cp\BildformateUtility;
use yii\web\Response;

/**
 * Nimmt das Formular der Utility „Bildformate“ entgegen und legt je Entry-Type einen
 * Resave-Job in die Queue — denselben, den `craft resave/entries --queue` nutzt.
 */
class BildformateController extends Controller
{
    public function actionAnstossen(): Response
    {
        $this->requirePostRequest();
        $this->requirePermission('utility:' . BildformateUtility::id());

        $gewaehlt = $this->request->getBodyParam('entryTypes');
        $bekannt = array_keys(BildformateUtility::entryTypes());

        // '*' kommt von „Alle“; alles andere gegen die Liste der Utility filtern.
        $handles = $gewaehlt === '*'
            ? $bekannt
            : array_values(array_intersect(is_array($gewaehlt) ? $gewaehlt : [], $bekannt));

        if ($handles === []) {
            return $this->asFailure('Kein Entry-Type gewählt.');
        }

        foreach ($handles as $handle) {
            // status null: auch deaktivierte Einträge tragen Bilder, und Imagers Regeln
            // arbeiten ebenfalls ohne Status-Filter.
            Queue::push(new ResaveElements([
                'elementType' => Entry::class,
                'criteria' => ['type' => $handle, 'status' => null],
            ]));
        }

        return $this->asSuccess(sprintf(
            '%d %s in die Queue gelegt. Die Bildformate entstehen, sobald der Cronjob die Einträge gespeichert hat.',
            count($handles),
            count($handles) === 1 ? 'Resave-Job' : 'Resave-Jobs',
        ));
    }
}
