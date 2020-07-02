<?php
/**
 * PatientDICOMRestController
 *
 * @package   OpenEMR
 * @link      http://www.open-emr.org
 * @author    Matthew Vita <matthewvita48@gmail.com>
 * @copyright Copyright (c) 2018 Matthew Vita <matthewvita48@gmail.com>
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */


namespace OpenEMR\RestControllers;

use OpenEMR\Services\PatientDICOMService;
use OpenEMR\RestControllers\RestControllerHelper;

class PatientDICOMRestController
{
    private $patientDICOMService;

    public function __construct()
    {
        $this->patientDICOMService = new PatientDICOMService();
       // $this->patientDICOMService->setDICOMid($DICOM_id);
    }

//    public function post($data)
//    {
//        $validationResult = $this->patientService->validate($data);
//
//        $validationHandlerResult = RestControllerHelper::validationHandler($validationResult);
//        if (is_array($validationHandlerResult)) {
//            return $validationHandlerResult; }
//
//        $serviceResult = $this->patientService->insert($data);
//        return RestControllerHelper::responseHandler($serviceResult, array("pid" => $serviceResult), 201);
//    }
//
//    public function put($pid, $data)
//    {
//        $validationResult = $this->patientService->validate($data);
//
//        $validationHandlerResult = RestControllerHelper::validationHandler($validationResult);
//        if (is_array($validationHandlerResult)) {
//            return $validationHandlerResult; }
//
//        $serviceResult = $this->patientService->update($pid, $data);
//        return RestControllerHelper::responseHandler($serviceResult, array("pid" => $pid), 200);
//    }
//
//    public function getOne()
//    {
//        $serviceResult = $this->patientService->getOne();
//        return RestControllerHelper::responseHandler($serviceResult, null, 200);
//    }

    public function getAll($search)
    {
        $serviceResult = $this->patientDICOMService->getAll(array(
            'patient_data_id' => $search['patient_data_id'],
            'history_data_id' => $search['history_data_id'],
            'filename' => $search['filename']
        ));

        return RestControllerHelper::responseHandler($serviceResult, null, 200);
    }
}
