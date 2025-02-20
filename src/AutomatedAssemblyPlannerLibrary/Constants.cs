﻿
using System;
using System.IO;
using System.Xml.Serialization;
namespace Assembly_Planner
{

    public enum ConnectType
    {
        rectilinear = 1,
        radial = 2,
        loose_contact = 3,
        unknown = 4,
        strongly_connected = 5,
        unknown_connection = 6
    };

    public enum InstallCharacterType
    {
        /// <summary>
        /// The moving part is fully inside the reference part
        /// </summary>
        MovingIsInsideReference = 3,
        /// <summary>
        /// The moving part is on the outside or near the surface of reference part
        /// </summary>
        MovingIsOnOutsideOfReference = 2,
        /// <summary>
        /// The moving part and the reference part are similar in size
        /// </summary>
        MovingReferenceSimiliar = 1,
        /// <summary>
        /// The reference part and the moving are similiar but they should be switched (moving is harder to move).
        /// </summary>
        ReferenceMovingSimiliarSwitch = -1,
        /// <summary>
        /// The reference part is on the outside or near the surface of moving part - they should be switched.
        /// </summary>
        ReferenceIsOnOutsideOfMoving = -2,
        /// <summary>
        /// The reference part is fully inside the moving part - they should be switched.
        /// </summary>
        ReferenceIsInsideMoving = -3,
        Unknown = 0
    }


    public class Constants
    {

        // Weights for differne evalutations
        //
        public const double Innerstabilityweight = 10;

        public const double Installtimeweight = 0;
        public const double Movingtimeweight = 0;
        public const double Rotatetimeweight = 0;



        public static Constants Values;
        public const string CADAssemblyFileName = "input.sat";
        public const string AssemblyXMLFileName = "input.xml";

        /* ants for determining which subassembly is moving and which is the reference. */
        public const double CVXFormerFaceConfidence = 0.5;
        public const double CVXOnInsideThreshold = 0.05;
        public const double CVXOnOutsideThreshold = 0.5;



        // Global ants for gxml
        public const int VISIBLE_DOF = -1000;         // visible DOF Tag
        public const int INVISIBLE_DOF = -2000;        // invisible DOF Tag
        public const int CLASH_LOCATION = -4000;      // clash location Tag
        public const int CONCENTRIC_DOF = -3000;     // concentric DOF Tag
        public const int EVALUATION = -1001;        // evaluation DOF Tag
        public const int BOXDIMENSIONS = -5000; //??
        public const int WEIGHT = -6000;
        public const int VOLUME = -6001;
        public const int CENTEROFMASS = -6005;
        public const int TRANSLATION = -7000;
        public const int ORDERSCORE = -8000;


        public const double MaxForce = 180; // this is in Newtons, similiar to 40 lbs.
        public const double StoppingDistance = 0.01; // in m (or 10 mm) distance to stop any object
        public const double MaxTravelSpeed = 1.0; // 1 meter per second
        public const double MaxInsertionSpeed = 0.2; // m per second
        public const double NearlyParallelFace = 0.03; //equivalent to 88.85 degrees //0.02
        public const double NearlyOnLine = 0.005; // about 178.8 degrees  0.0005
        public const double MaxPathForInfeasibleInstall = 999999.99999;
        public const double SameWithinError = 1e-9;
        public const double MinInterfaceSuccessRate = 0.8;
        public const double boltinsertSpeed = 2; // just a guess. the unit is mm/s

        internal static string[] ValidShapeFileTypes = { ".ply", ".stl", ".off", ".3mf", ".amf", ".tvgl" };
        internal static string[] DefaultInputArguments = { ".", "y", "1", "0.5", "y" };

    }
}
