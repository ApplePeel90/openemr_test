<?php
/**
 * Encounter form save script.
 *
 * @package   OpenEMR
 * @link      http://www.open-emr.org
 * @author    Roberto Vasquez <robertogagliotta@gmail.com>
 * @author    Brady Miller <brady.g.miller@gmail.com>
 * @copyright Copyright (c) 2015 Roberto Vasquez <robertogagliotta@gmail.com>
 * @copyright Copyright (c) 2019 Brady Miller <brady.g.miller@gmail.com>
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */


require_once("../../globals.php");
require_once("$srcdir/forms.inc");
require_once("$srcdir/encounter.inc");
require_once("$srcdir/acl.inc");

use OpenEMR\Common\Csrf\CsrfUtils;
use OpenEMR\Services\FacilityService;

if (!CsrfUtils::verifyCsrfToken($_POST["csrf_token_form"])) {
    CsrfUtils::csrfNotVerified();
}

$facilityService = new FacilityService();

$date             = (isset($_POST['form_date']))            ? DateToYYYYMMDD($_POST['form_date']) : '';
$onset_date       = (isset($_POST['form_onset_date']))      ? DateToYYYYMMDD($_POST['form_onset_date']) : '';
$sensitivity      = (isset($_POST['form_sensitivity']))     ? $_POST['form_sensitivity'] : '';
$pc_catid         = (isset($_POST['pc_catid']))             ? $_POST['pc_catid'] : '';
$facility_id      = (isset($_POST['facility_id']))          ? $_POST['facility_id'] : '';
$billing_facility = (isset($_POST['billing_facility']))     ? $_POST['billing_facility'] : '';
$reason           = (isset($_POST['reason']))               ? $_POST['reason'] : '';
$mode             = (isset($_POST['mode']))                 ? $_POST['mode'] : '';
$referral_source  = (isset($_POST['form_referral_source'])) ? $_POST['form_referral_source'] : '';
$pos_code         = (isset($_POST['pos_code']))              ? $_POST['pos_code'] : '';
//save therapy group if exist in external_id column
$external_id         = isset($_POST['form_gid']) ? $_POST['form_gid'] : '';

$facilityresult = $facilityService->getById($facility_id);
$facility = $facilityresult['name'];

$normalurl = "patient_file/encounter/encounter_top.php";

$nexturl = $normalurl;

if ($mode == 'new') {
    $provider_id = $userauthorized ? $_SESSION['authUserID'] : 0;
    $encounter = generate_id();
    addForm(
        $encounter,
        "New Patient Encounter",
        sqlInsert(
            "INSERT INTO form_encounter SET
                date = ?,      
                onset_date = ?,
                reason = ?,
                facility = ?,
                pc_catid = ?,
                facility_id = ?,
                billing_facility = ?,
                sensitivity = ?,
                referral_source = ?,
                pid = ?,
                encounter = ?,
                pos_code = ?,
                external_id = ?,
                provider_id = ?",
            [
                $date,
                $onset_date,
                $reason,
                $facility,
                $pc_catid,
                $facility_id,
                $billing_facility,
                $sensitivity,
                $referral_source,
                $pid,
                $encounter,
                $pos_code,
                $external_id,
                $provider_id
            ]
        ),
        "newpatient",
        $pid,
        $userauthorized,
        $date
    );
} else if ($mode == 'update') {
    $id = $_POST["id"];
    $result = sqlQuery("SELECT encounter, sensitivity FROM form_encounter WHERE id = ?", array($id));
    if ($result['sensitivity'] && !acl_check('sensitivities', $result['sensitivity'])) {
        die(xlt("You are not authorized to see this encounter."));
    }

    $encounter = $result['encounter'];
    // See view.php to allow or disallow updates of the encounter date.
    $datepart = "";
    $sqlBindArray = array();
    if (acl_check('encounters', 'date_a')) {
        $datepart = "date = ?, ";
        $sqlBindArray[] = $date;
    }
    array_push(
        $sqlBindArray,
        $onset_date,
        $reason,
        $facility,
        $pc_catid,
        $facility_id,
        $billing_facility,
        $sensitivity,
        $referral_source,
        $pos_code,
        $id
    );
    sqlStatement(
        "UPDATE form_encounter SET
            $datepart
            onset_date = ?,
            reason = ?,
            facility = ?,
            pc_catid = ?,
            facility_id = ?,
            billing_facility = ?,
            sensitivity = ?,
            referral_source = ?,
            pos_code = ? WHERE id = ?",
        $sqlBindArray
    );
} else {
    die("Unknown mode '" . text($mode) . "'");
}

setencounter($encounter);

// Update the list of issues associated with this encounter.
if (is_array($_POST['issues'])) {
    sqlStatement("DELETE FROM issue_encounter WHERE " .
    "pid = ? AND encounter = ?", array($pid, $encounter));
    foreach ($_POST['issues'] as $issue) {
        $query = "INSERT INTO issue_encounter ( pid, list_id, encounter ) VALUES (?,?,?)";
        sqlStatement($query, array($pid,$issue,$encounter));
    }
}

$result4 = sqlStatement("SELECT fe.encounter,fe.date,openemr_postcalendar_categories.pc_catname FROM form_encounter AS fe ".
    " left join openemr_postcalendar_categories on fe.pc_catid=openemr_postcalendar_categories.pc_catid  WHERE fe.pid = ? order by fe.date desc", array($pid));
?>
<html>
<body>
<script language='JavaScript'>
    EncounterDateArray=new Array;
    CalendarCategoryArray=new Array;
    EncounterIdArray=new Array;
    Count=0;
        <?php
        if (sqlNumRows($result4)>0) {
            while ($rowresult4 = sqlFetchArray($result4)) {
                ?>
        EncounterIdArray[Count]=<?php echo js_escape($rowresult4['encounter']); ?>;
    EncounterDateArray[Count]=<?php echo js_escape(oeFormatShortDate(date("Y-m-d", strtotime($rowresult4['date'])))); ?>;
    CalendarCategoryArray[Count]=<?php echo js_escape(xl_appt_category($rowresult4['pc_catname'])); ?>;
            Count++;
                <?php
            }
        }
        ?>

    // Get the left_nav window, and the name of its sibling (top or bottom) frame that this form is in.
    // This works no matter how deeply we are nested

    var my_left_nav = top.left_nav;
    var w = window;
    for (; w.parent != top; w = w.parent);
    var my_win_name = w.name;
    my_left_nav.setPatientEncounter(EncounterIdArray,EncounterDateArray,CalendarCategoryArray);
    top.restoreSession();
<?php if ($mode == 'new') { ?>
    my_left_nav.setEncounter(<?php echo js_escape(oeFormatShortDate($date)) . ", " . js_escape($encounter) . ", window.name"; ?>);
    // Load the tab set for the new encounter, w is usually the RBot frame.
    w.location.href = '<?php echo "$rootdir/patient_file/encounter/encounter_top.php"; ?>';
<?php } else { // not new encounter ?>
    // Always return to encounter summary page.
    window.location.href = '<?php echo "$rootdir/patient_file/encounter/forms.php"; ?>';
<?php } // end if not new encounter ?>

</script>

</body>
</html>
