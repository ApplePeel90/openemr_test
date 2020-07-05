<?php
/**
 * PatientDICOM Service
 *
 * @package   OpenEMR
 * @link      http://www.open-emr.org
 * @author    Victor Kofia <victor.kofia@gmail.com>
 * @author    Brady Miller <brady.g.miller@gmail.com>
 * @copyright Copyright (c) 2017 Victor Kofia <victor.kofia@gmail.com>
 * @copyright Copyright (c) 2018 Brady Miller <brady.g.miller@gmail.com>
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */


namespace OpenEMR\Services;

use Particle\Validator\Validator;

class PatientDICOMService
{

    /**
     * In the case where a patient doesn't have a picture uploaded,
     * this value will be returned so that the document controller
     * can return an empty response.
     */
    private $patient_picture_fallback_id = -1;

    private $DICOM_id;

    /**
     * Default constructor.
     */
    public function __construct()
    {
    }

//    public function validate($patient)
//    {
//        $validator = new Validator();
//
//        $validator->required('fname')->lengthBetween(2, 255);
//        $validator->required('lname')->lengthBetween(2, 255);
//        $validator->required('sex')->lengthBetween(4, 30);
//        $validator->required('dob')->datetime('Y-m-d');
//
//
//        return $validator->validate($patient);
//    }

//    public function setDICOMid($DICOM_id)
//    {
//        $this->DICOM_id= $DICOM_id;
//    }
//
//    public function getPid()
//    {
//        return $this->pid;
//    }

//    /**
//     * TODO: This should go in the ChartTrackerService and doesn't have to be static.
//     * @param $pid unique patient id
//     * @return recordset
//     */
//    public static function getChartTrackerInformationActivity($pid)
//    {
//        $sql = "SELECT ct.ct_when,
//                   ct.ct_userid,
//                   ct.ct_location,
//                   u.username,
//                   u.fname,
//                   u.mname,
//                   u.lname
//            FROM chart_tracker AS ct
//            LEFT OUTER JOIN users AS u ON u.id = ct.ct_userid
//            WHERE ct.ct_pid = ?
//            ORDER BY ct.ct_when DESC";
//        return sqlStatement($sql, array($pid));
//    }

//    /**
//     * TODO: This should go in the ChartTrackerService and doesn't have to be static.
//     * @return recordset
//     */
//    public static function getChartTrackerInformation()
//    {
//        $sql = "SELECT ct.ct_when,
//                   u.username,
//                   u.fname AS ufname,
//                   u.mname AS umname,
//                   u.lname AS ulname,
//                   p.pubpid,
//                   p.fname,
//                   p.mname,
//                   p.lname
//            FROM chart_tracker AS ct
//            JOIN cttemp ON cttemp.ct_pid = ct.ct_pid AND cttemp.ct_when = ct.ct_when
//            LEFT OUTER JOIN users AS u ON u.id = ct.ct_userid
//            LEFT OUTER JOIN patient_data AS p ON p.pid = ct.ct_pid
//            WHERE ct.ct_userid != 0
//            ORDER BY p.pubpid";
//        return sqlStatement($sql);
//    }

   public function getFreshDICOM_id()
   {
       $DICOM_id = sqlQuery("SELECT MAX(DICOM_id)+1 AS DICOM_id FROM patient_DICOM");

       return $DICOM_id['DICOM_id'] === null ? 1 : $DICOM_id['DICOM_id'];
   }

   public function insert($data)
   {
       $fresh_DICOM_id = $this->getFreshDICOM_id();

       $sql = " INSERT INTO patient_DICOM SET";
       $sql .= "     DICOM_id=?,";
       $sql .= "     patient_data_id=?,";
       $sql .= "     DICOM_path=?,";
       $sql .= "     filename=?,";
       $sql .= "     fileModDate=?,";
       $sql .= "     fileSize=?,";
       $sql .= "     formatVersion=?,";
       $sql .= "     width=?,";
       $sql .= "     height=?,";
       $sql .= "     bigDepth=?,";
       $sql .= "     colorType=?,";
       $sql .= "     fileMetaInformationGroupLength=?,";
       $sql .= "     FileMetaInformationVersion=?,";
       $sql .= "     MediaStorageSOPClassUID=?,";
       $sql .= "     MediaStorageSOPInstanceUID=?,";
       $sql .= "     TransferSyntaxUID=?,";
       $sql .= "     ImplementationClassUID=?,";
       $sql .= "     history_data_id=?";

       $results = sqlInsert(
           $sql,
           array(
               $fresh_DICOM_id,
               $data["patient_data_id"],
               $data["DICOM_path"],
               $data["filename"],
               $data["fileModDate"],
               $data["fileSize"],
               $data["formatVersion"],
               $data["width"],
               $data["height"],
               $data["bigDepth"],
               $data["colorType"],
               $data["fileMetaInformationGroupLength"],
               $data["FileMetaInformationVersion"],
               $data["MediaStorageSOPClassUID"],
               $data["MediaStorageSOPInstanceUID"],
               $data["TransferSyntaxUID"],
               $data["ImplementationClassUID"],
               $data["history_data_id"]
           )
       );

       if ($results) {
           return $fresh_DICOM_id;
       }

       return $results;
   }

   public function update($DICOM_id, $data)
   {
        $sql = " UPDATE patient_DICOM SET";
        $sql .= "     patient_data_id=?,";
        $sql .= "     DICOM_path=?,";
        $sql .= "     filename=?,";
        $sql .= "     fileModDate=?,";
        $sql .= "     fileSize=?,";
        $sql .= "     formatVersion=?,";
        $sql .= "     width=?,";
        $sql .= "     height=?,";
        $sql .= "     bigDepth=?,";
        $sql .= "     colorType=?,";
        $sql .= "     fileMetaInformationGroupLength=?,";
        $sql .= "     FileMetaInformationVersion=?,";
        $sql .= "     MediaStorageSOPClassUID=?,";
        $sql .= "     MediaStorageSOPInstanceUID=?,";
        $sql .= "     TransferSyntaxUID=?,";
        $sql .= "     ImplementationClassUID=?,";
        $sql .= "     history_data_id=?";
        $sql .= "     where DICOM_id=?";

       return sqlStatement(
           $sql,
           array(
               $data["patient_data_id"],
               $data["DICOM_path"],
               $data["filename"],
               $data["fileModDate"],
               $data["fileSize"],
               $data["formatVersion"],
               $data["width"],
               $data["height"],
               $data["bigDepth"],
               $data["colorType"],
               $data["fileMetaInformationGroupLength"],
               $data["FileMetaInformationVersion"],
               $data["MediaStorageSOPClassUID"],
               $data["MediaStorageSOPInstanceUID"],
               $data["TransferSyntaxUID"],
               $data["ImplementationClassUID"],
               $data["history_data_id"],
               $DICOM_id
           )
       );
   }

    public function getAll($search)
    {
        $sqlBindArray = array();

        $sql = "SELECT *
                FROM patient_DICOM";

//        if ($search['name'] || $search['fname'] || $search['lname'] || $search['dob']) {
//            $sql .= " WHERE ";
//
//            $whereClauses = array();
//            if ($search['name']) {
//                $search['name'] = '%' . $search['name'] . '%';
//                array_push($whereClauses, "CONCAT(lname,' ', fname) LIKE ?");
//                array_push($sqlBindArray, $search['name']);
//            }
//            if ($search['fname']) {
//                array_push($whereClauses, "fname=?");
//                array_push($sqlBindArray, $search['fname']);
//            }
//            if ($search['lname']) {
//                array_push($whereClauses, "lname=?");
//                array_push($sqlBindArray, $search['lname']);
//            }
//            if ($search['dob'] || $search['birthdate']) {
//                $search['dob'] = !empty($search['dob']) ? $search['dob'] : $search['birthdate'];
//                array_push($whereClauses, "dob=?");
//                array_push($sqlBindArray, $search['dob']);
//            }
//
//            $sql .= implode(" AND ", $whereClauses);
//        }

        $statementResults = sqlStatement($sql, $sqlBindArray);

        $results = array();
        while ($row = sqlFetchArray($statementResults)) {
            array_push($results, $row);
        }

        return $results;
    }


    public function getById($id)
    {
        $sql = "SELECT *
                FROM patient_DICOM
                WHERE patient_data_id = ?";
    
        return sqlQuery($sql, $id);
    }
 
    public function delete($DICOM_id)
    {
        return sqlStatement("DELETE FROM patient_DICOM WHERE DICOM_id = ?", $DICOM_id);
    }

//    public function getOne()
//    {
//        $sql = "SELECT id,
//                   pid,
//                   pubpid,
//                   title,
//                   fname,
//                   mname,
//                   lname,
//                   street,
//                   postal_code,
//                   city,
//                   state,
//                   country_code,
//                   phone_contact,
//                   email,
//                   dob,
//                   sex,
//                   race,
//                   ethnicity
//                FROM patient_data
//                WHERE pid = ?";
//
//        return sqlQuery($sql, $this->pid);
//    }

//    /**
//     * @return number
//     */
//    public function getPatientPictureDocumentId()
//    {
//        $sql = "SELECT doc.id AS id
//                 FROM documents doc
//                 JOIN categories_to_documents cate_to_doc
//                   ON doc.id = cate_to_doc.document_id
//                 JOIN categories cate
//                   ON cate.id = cate_to_doc.category_id
//                WHERE cate.name LIKE ? and doc.foreign_id = ?";
//
//        $result = sqlQuery($sql, array($GLOBALS['patient_photo_category_name'], $this->pid));
//
//        if (empty($result) || empty($result['id'])) {
//            return $this->patient_picture_fallback_id;
//        }
//
//        return $result['id'];
//    }
}
